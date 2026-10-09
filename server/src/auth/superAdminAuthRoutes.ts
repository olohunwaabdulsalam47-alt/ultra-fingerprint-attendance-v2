import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";

import { databasePool } from "../config/database.js";
import { authenticateSuperAdmin } from "./superAdminAuthService.js";
import {
  createPlatformSession,
} from "./sessionService.js";
import {
  createOtpChallenge,
  verifyOtpChallenge,
} from "./otpService.js";
import {
  generateSecureToken,
  hashToken,
} from "./crypto.js";
import { sendSuperAdminOtpSms } from "./termiiSmsService.js";

const router = Router();

const SESSION_COOKIE = "ufa_session";
const DEVICE_COOKIE = "ufa_device";

const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;
const DEVICE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getClientKey(request: Request): string {
  return request.ip ?? "unknown";
}

function isRateLimited(request: Request): boolean {
  const now = Date.now();
  const key = getClientKey(request);

  // Remove expired entries to prevent unnecessary memory growth.
  for (const [entryKey, entry] of rateLimits.entries()) {
    if (entry.resetAt <= now) {
      rateLimits.delete(entryKey);
    }
  }

  const entry = rateLimits.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });

    return false;
  }

  entry.count += 1;

  return entry.count > RATE_LIMIT_MAX;
}

function readCookie(
  request: Request,
  cookieName: string,
): string | null {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = cookie.slice(0, separatorIndex).trim();

    if (name !== cookieName) {
      continue;
    }

    const value = cookie.slice(separatorIndex + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}

function setSessionCookie(
  response: Response,
  sessionToken: string,
): void {
  response.cookie(SESSION_COOKIE, sessionToken, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
}

function setDeviceCookie(
  response: Response,
  deviceToken: string,
): void {
  response.cookie(DEVICE_COOKIE, deviceToken, {
    ...cookieOptions,
    maxAge: DEVICE_MAX_AGE,
  });
}

function clearAuthenticationCookies(response: Response): void {
  response.clearCookie(SESSION_COOKIE, cookieOptions);
  response.clearCookie(DEVICE_COOKIE, cookieOptions);
}

function invalidRequest(response: Response): void {
  response.status(400).json({
    success: false,
    message: "Please check the information provided.",
  });
}

/**
 * POST /api/superadmin/login
 *
 * Checks the SuperAdmin's phone number and password.
 * Trusted devices can proceed without another OTP.
 * Untrusted devices must complete SMS verification.
 */
router.post(
  "/login",
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      response.setHeader("Retry-After", "900");

      response.status(429).json({
        success: false,
        message: "Too many attempts. Please try again later.",
      });

      return;
    }

    const { phoneNumber, password, deviceName } = request.body ?? {};

    if (
      typeof phoneNumber !== "string" ||
      !/^\+[1-9]\d{7,14}$/.test(phoneNumber) ||
      typeof password !== "string" ||
      password.length < 1 ||
      password.length > 256 ||
      (deviceName !== undefined &&
        (typeof deviceName !== "string" || deviceName.length > 120))
    ) {
      invalidRequest(response);
      return;
    }

    try {
      const user = await authenticateSuperAdmin(
        phoneNumber,
        password,
      );

      if (!user) {
        response.status(401).json({
          success: false,
          message: "Invalid phone number or password.",
        });

        return;
      }

      const deviceToken = readCookie(request, DEVICE_COOKIE);

      if (deviceToken) {
        const deviceTokenHash = hashToken(deviceToken);

        const trustedDeviceResult = await databasePool.query<{
          id: string;
        }>(
          `SELECT id
           FROM platform_trusted_devices
           WHERE platform_user_id = $1
             AND device_token_hash = $2
             AND revoked_at IS NULL
             AND expires_at > NOW()
           LIMIT 1`,
          [user.id, deviceTokenHash],
        );

        const trustedDevice = trustedDeviceResult.rows[0];

        if (trustedDevice) {
          await databasePool.query(
            `UPDATE platform_trusted_devices
             SET last_used_at = NOW()
             WHERE id = $1`,
            [trustedDevice.id],
          );

          const session = await createPlatformSession(
            user.id,
            trustedDevice.id,
          );

          setSessionCookie(response, session.sessionToken);

          response.status(200).json({
            success: true,
            requiresOtp: false,
            message: "Login successful.",
            user: {
              id: user.id,
              fullName: user.fullName,
              phoneNumber: user.phoneNumber,
              role: "SUPER_ADMIN",
            },
          });

          return;
        }
      }

      const challenge = await createOtpChallenge(
        user.id,
        user.phoneNumber,
      );

      // The OTP must be sent by SMS.
      // Never include challenge.otpCode in the HTTP response.
      const delivery = await sendSuperAdminOtpSms(
        user.phoneNumber,
        challenge.otpCode,
      );

      if (!delivery.success) {
        response.status(503).json({
          success: false,
          message: "Verification SMS could not be sent. Please try again.",
        });

        return;
      }

      response.status(202).json({
        success: true,
        requiresOtp: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        message: "A verification code has been sent to your phone.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Login could not be completed. Please try again.",
      });
    }
  },
);

/**
 * POST /api/superadmin/verify-otp
 *
 * Verifies an OTP and registers the device as trusted.
 * A session is issued only after successful verification.
 */
router.post(
  "/verify-otp",
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      response.setHeader("Retry-After", "900");

      response.status(429).json({
        success: false,
        message: "Too many attempts. Please try again later.",
      });

      return;
    }

    const { challengeId, otp, deviceName } = request.body ?? {};

    const validChallengeId =
      typeof challengeId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        challengeId,
      );

    if (
      !validChallengeId ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp) ||
      (deviceName !== undefined &&
        (typeof deviceName !== "string" || deviceName.length > 120))
    ) {
      invalidRequest(response);
      return;
    }

    try {
      const verification = await verifyOtpChallenge(
        challengeId,
        otp,
      );

      if (verification !== "VERIFIED") {
        const statusCode =
          verification === "LOCKED" ? 429 : 401;

        response.status(statusCode).json({
          success: false,
          message:
            verification === "EXPIRED"
              ? "The verification code has expired. Please request another."
              : verification === "LOCKED"
                ? "Too many incorrect codes. Please request another verification code."
                : verification === "ALREADY_USED"
                  ? "This verification code has already been used."
                  : "The verification code is invalid.",
        });

        return;
      }

      // Retrieve the account associated with the now-consumed challenge.
      const challengeResult = await databasePool.query<{
        platform_user_id: string;
        phone_number: string;
      }>(
        `SELECT c.platform_user_id, c.phone_number
         FROM platform_otp_challenges c
         INNER JOIN platform_users u
           ON u.id = c.platform_user_id
         WHERE c.id = $1
           AND c.consumed_at IS NOT NULL
           AND c.purpose = 'TRUST_NEW_DEVICE'
           AND u.role = 'SUPER_ADMIN'
           AND u.is_active = TRUE
           AND u.phone_number = c.phone_number
         LIMIT 1`,
        [challengeId],
      );

      const verifiedChallenge = challengeResult.rows[0];

      if (!verifiedChallenge) {
        response.status(401).json({
          success: false,
          message: "The verification could not be completed.",
        });

        return;
      }

      const deviceToken = generateSecureToken();
      const deviceTokenHash = hashToken(deviceToken);

      const trustedDeviceResult = await databasePool.query<{
        id: string;
      }>(
        `INSERT INTO platform_trusted_devices (
           platform_user_id,
           device_token_hash,
           device_name,
           expires_at
         )
         VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')
         RETURNING id`,
        [
          verifiedChallenge.platform_user_id,
          deviceTokenHash,
          typeof deviceName === "string"
            ? deviceName.trim().slice(0, 120) || null
            : null,
        ],
      );

      const trustedDevice = trustedDeviceResult.rows[0];

      if (!trustedDevice) {
        throw new Error("Trusted device creation failed.");
      }

      const session = await createPlatformSession(
        verifiedChallenge.platform_user_id,
        trustedDevice.id,
      );

      setDeviceCookie(response, deviceToken);
      setSessionCookie(response, session.sessionToken);

      response.status(200).json({
        success: true,
        requiresOtp: false,
        message: "Verification successful. You are now logged in.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Verification could not be completed. Please try again.",
      });
    }
  },
);

/**
 * POST /api/superadmin/logout
 *
 * Revokes the current server-side session and clears the session cookie.
 */
router.post(
  "/logout",
  async (request: Request, response: Response) => {
    const sessionToken = readCookie(request, SESSION_COOKIE);

    try {
      if (sessionToken) {
        const { revokeSuperAdminSession } = await import(
          "./sessionService.js"
        );

        await revokeSuperAdminSession(sessionToken);
      }

      clearAuthenticationCookies(response);

      response.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch {
      clearAuthenticationCookies(response);

      response.status(500).json({
        success: false,
        message: "Logout could not be completed.",
      });
    }
  },
);

export default router;
