
import { Router, type Request, type Response } from "express";
import { databasePool } from "../config/database.js";
import { authenticateSuperAdmin } from "./superAdminAuthService.js";
import {
  createPlatformSession,
  revokeSuperAdminSession,
} from "./sessionService.js";
import { createOtpChallenge, verifyOtpChallenge } from "./otpService.js";
import { generateSecureToken, hashToken } from "./crypto.js";
import { sendSuperAdminOtpSms } from "./termiiSmsService.js";
import { requireSuperAdmin } from "./superAdminAuthMiddleware.js";
import {
  createSecurityAccessGrant,
  revokeSecurityAccessGrants,
} from "./securityPageAccessService.js";
import { requireSecurityPageAccess } from "./securityPageAccessMiddleware.js";

const router = Router();

const SESSION_COOKIE = "ufa_session";
const DEVICE_COOKIE = "ufa_device";
const SECURITY_ACCESS_COOKIE = "ufa_security_access";

const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;
const DEVICE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const SECURITY_ACCESS_MAX_AGE = 5 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  path: "/",
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const requestAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientKey(request: Request): string {
  // Use the direct socket address unless trusted-proxy configuration
  // is explicitly established by the server deployment.
  return request.socket.remoteAddress ?? "unknown";
}

function isRateLimited(request: Request): boolean {
  const key = getClientKey(request);
  const now = Date.now();
  const current = requestAttempts.get(key);

  if (!current || now >= current.resetAt) {
    requestAttempts.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function rejectRateLimitedRequest(response: Response): void {
  response.status(429).json({
    success: false,
    message: "Too many attempts. Please try again later.",
  });
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    const value = part.slice(separator + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}

function setSessionCookie(response: Response, token: string): void {
  response.cookie(SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
}

function setDeviceCookie(response: Response, token: string): void {
  response.cookie(DEVICE_COOKIE, token, {
    ...cookieOptions,
    maxAge: DEVICE_MAX_AGE,
  });
}

function setSecurityAccessCookie(response: Response, token: string): void {
  response.cookie(SECURITY_ACCESS_COOKIE, token, {
    ...cookieOptions,
    maxAge: SECURITY_ACCESS_MAX_AGE,
  });
}

function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, cookieOptions);
}

function clearDeviceCookie(response: Response): void {
  response.clearCookie(DEVICE_COOKIE, cookieOptions);
}

function clearSecurityAccessCookie(response: Response): void {
  response.clearCookie(SECURITY_ACCESS_COOKIE, cookieOptions);
}

function invalidRequest(response: Response): void {
  response.status(400).json({
    success: false,
    message: "Invalid request.",
  });
}

function isValidChallengeId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 10 &&
    value.length <= 200
  );
}

function isValidOtp(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

/**
 * Initial Staff ID entry.
 *
 * This validates the registered SuperAdmin Staff ID and password.
 * It does NOT create a session, send an OTP, or grant dashboard access.
 * The frontend should navigate to the separate SuperAdmin Login page
 * only after receiving the successful response.
 */
router.post("/entry", async (request: Request, response: Response) => {
  if (isRateLimited(request)) {
    rejectRateLimitedRequest(response);
    return;
  }

  const { staffId, password } = request.body ?? {};

  if (
    typeof staffId !== "string" ||
    staffId.trim().length < 1 ||
    staffId.trim().length > 40 ||
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 1024
  ) {
    invalidRequest(response);
    return;
  }

  try {
    const account = await authenticateSuperAdmin(
      staffId.trim(),
      password,
    );

    if (
      !account ||
      !account.staffId ||
      account.staffId.toUpperCase() !== staffId.trim().toUpperCase()
    ) {
      response.status(401).json({
        success: false,
        message: "Invalid Staff ID or password.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      next: "SUPERADMIN_LOGIN",
      message: "Continue to SuperAdmin Login.",
    });
  } catch {
    response.status(500).json({
      success: false,
      message: "Unable to continue. Please try again.",
    });
  }
});

/**
 * Begin SuperAdmin login using registered phone number and password.
 * Successful password verification starts an SMS OTP challenge.
 */
router.post("/login", async (request: Request, response: Response) => {
  if (isRateLimited(request)) {
    rejectRateLimitedRequest(response);
    return;
  }

  const { phoneNumber, password, deviceName } = request.body ?? {};

  if (
    typeof phoneNumber !== "string" ||
    !/^\+[1-9]\d{7,14}$/.test(phoneNumber) ||
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 1024 ||
    (deviceName !== undefined &&
      (typeof deviceName !== "string" || deviceName.length > 100))
  ) {
    invalidRequest(response);
    return;
  }

  try {
    const account = await authenticateSuperAdmin(phoneNumber, password);

    if (!account || account.phoneNumber !== phoneNumber) {
      response.status(401).json({
        success: false,
        message: "Invalid phone number or password.",
      });
      return;
    }

    const challenge = await createOtpChallenge({
      superAdminId: account.id,
      phoneNumber: account.phoneNumber,
      purpose: "SUPERADMIN_LOGIN",
    });

    const sent = await sendSuperAdminOtpSms(
      account.phoneNumber,
      challenge.otp,
    );

    if (!sent) {
      response.status(503).json({
        success: false,
        message: "Unable to send verification code. Please try again.",
      });
      return;
    }

    response.status(202).json({
      success: true,
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
      message: "Verification code sent.",
    });
  } catch {
    response.status(500).json({
      success: false,
      message: "Unable to start login. Please try again.",
    });
  }
});

/**
 * Verify login OTP and create the authenticated platform session.
 */
router.post(
  "/verify-otp",
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const { challengeId, otp, deviceName } = request.body ?? {};

    if (
      !isValidChallengeId(challengeId) ||
      !isValidOtp(otp) ||
      (deviceName !== undefined &&
        (typeof deviceName !== "string" || deviceName.length > 100))
    ) {
      invalidRequest(response);
      return;
    }

    try {
      const challenge = await verifyOtpChallenge({
        challengeId,
        otp,
        purpose: "SUPERADMIN_LOGIN",
      });

      if (!challenge || !challenge.superAdminId) {
        response.status(401).json({
          success: false,
          message: "Invalid or expired verification code.",
        });
        return;
      }

      const accountResult = await databasePool.query<{
        id: string;
        full_name: string;
        phone_number: string | null;
      }>(
        `SELECT id, full_name, phone_number
         FROM platform_users
         WHERE id = $1
           AND role = 'SUPER_ADMIN'
           AND is_active = TRUE
         LIMIT 1`,
        [challenge.superAdminId],
      );

      const account = accountResult.rows[0];

      if (
        !account ||
        !account.phone_number ||
        account.phone_number !== challenge.phoneNumber
      ) {
        response.status(401).json({
          success: false,
          message: "Account verification failed.",
        });
        return;
      }

      const deviceToken = generateSecureToken();
      const deviceTokenHash = hashToken(deviceToken);

      await databasePool.query(
        `INSERT INTO platform_trusted_devices
           (super_admin_id, device_token_hash, device_name, last_seen_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          account.id,
          deviceTokenHash,
          typeof deviceName === "string" && deviceName.trim()
            ? deviceName.trim()
            : "Unknown device",
        ],
      );

      const sessionToken = await createPlatformSession({
        superAdminId: account.id,
        deviceTokenHash,
      });

      await revokeSecurityAccessGrants(account.id);

      clearSecurityAccessCookie(response);
      setDeviceCookie(response, deviceToken);
      setSessionCookie(response, sessionToken);

      response.status(200).json({
        success: true,
        user: {
          id: account.id,
          fullName: account.full_name,
          phoneNumber: account.phone_number,
          role: "SUPER_ADMIN",
        },
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Unable to verify code. Please try again.",
      });
    }
  },
);

/**
 * Request a separate OTP for the Security & Privacy page.
 */
router.post(
  "/security/request-otp",
  requireSuperAdmin,
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const superAdminId = response.locals.superAdminId as string | undefined;

    if (!superAdminId) {
      response.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    try {
      const accountResult = await databasePool.query<{
        phone_number: string | null;
      }>(
        `SELECT phone_number
         FROM platform_users
         WHERE id = $1
           AND role = 'SUPER_ADMIN'
           AND is_active = TRUE
         LIMIT 1`,
        [superAdminId],
      );

      const account = accountResult.rows[0];

      if (!account?.phone_number) {
        response.status(403).json({
          success: false,
          message: "A registered phone number is required.",
        });
        return;
      }

      await revokeSecurityAccessGrants(superAdminId);

      const challenge = await createOtpChallenge({
        superAdminId,
        phoneNumber: account.phone_number,
        purpose: "SECURITY_PAGE_ACCESS",
      });

      const sent = await sendSuperAdminOtpSms(
        account.phone_number,
        challenge.otp,
      );

      if (!sent) {
        response.status(503).json({
          success: false,
          message: "Unable to send verification code. Please try again.",
        });
        return;
      }

      clearSecurityAccessCookie(response);

      response.status(202).json({
        success: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        message: "Security verification code sent.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Unable to request verification code.",
      });
    }
  },
);

/**
 * Verify the separate Security & Privacy OTP and grant short-lived access.
 */
router.post(
  "/security/verify-otp",
  requireSuperAdmin,
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const superAdminId = response.locals.superAdminId as string | undefined;
    const { challengeId, otp } = request.body ?? {};

    if (
      !superAdminId ||
      !isValidChallengeId(challengeId) ||
      !isValidOtp(otp)
    ) {
      invalidRequest(response);
      return;
    }

    try {
      const challenge = await verifyOtpChallenge({
        challengeId,
        otp,
        purpose: "SECURITY_PAGE_ACCESS",
      });

      if (
        !challenge ||
        challenge.superAdminId !== superAdminId
      ) {
        response.status(401).json({
          success: false,
          message: "Invalid or expired verification code.",
        });
        return;
      }

      const accountResult = await databasePool.query<{
        id: string;
        phone_number: string | null;
      }>(
        `SELECT id, phone_number
         FROM platform_users
         WHERE id = $1
           AND role = 'SUPER_ADMIN'
           AND is_active = TRUE
         LIMIT 1`,
        [superAdminId],
      );

      const account = accountResult.rows[0];

      if (
        !account ||
        !account.phone_number ||
        account.phone_number !== challenge.phoneNumber
      ) {
        response.status(401).json({
          success: false,
          message: "Account verification failed.",
        });
        return;
      }

      const grant = await createSecurityAccessGrant(superAdminId);

      setSecurityAccessCookie(response, grant.token);

      response.status(200).json({
        success: true,
        expiresAt: grant.expiresAt,
        message: "Security page access granted.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Unable to verify code. Please try again.",
      });
    }
  },
);

/**
 * Check whether the current session has the separate Security & Privacy grant.
 */
router.get(
  "/security/access",
  requireSuperAdmin,
  requireSecurityPageAccess,
  (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      access: true,
    });
  },
);

/**
 * Return the currently authenticated SuperAdmin account.
 */
router.get(
  "/me",
  requireSuperAdmin,
  async (_request: Request, response: Response) => {
    const superAdminId = response.locals.superAdminId as string | undefined;

    if (!superAdminId) {
      response.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    try {
      const result = await databasePool.query<{
        id: string;
        full_name: string;
        phone_number: string | null;
      }>(
        `SELECT id, full_name, phone_number
         FROM platform_users
         WHERE id = $1
           AND role = 'SUPER_ADMIN'
           AND is_active = TRUE
         LIMIT 1`,
        [superAdminId],
      );

      const account = result.rows[0];

      if (!account || !account.phone_number) {
        response.status(401).json({
          success: false,
          message: "Account is unavailable.",
        });
        return;
      }

      response.status(200).json({
        success: true,
        user: {
          id: account.id,
          fullName: account.full_name,
          phoneNumber: account.phone_number,
          role: "SUPER_ADMIN",
        },
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Unable to load account.",
      });
    }
  },
);

/**
 * Revoke the current platform session and its security grants.
 */
router.post(
  "/logout",
  async (request: Request, response: Response) => {
    const sessionToken = readCookie(request, SESSION_COOKIE);

    try {
      if (sessionToken) {
        await revokeSuperAdminSession(sessionToken);
      }

      const superAdminId = response.locals.superAdminId as
        | string
        | undefined;

      if (superAdminId) {
        await revokeSecurityAccessGrants(superAdminId);
      }

      clearSessionCookie(response);
      clearDeviceCookie(response);
      clearSecurityAccessCookie(response);

      response.status(200).json({
        success: true,
        message: "Signed out.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Unable to sign out. Please try again.",
      });
    }
  },
);

export default router;
    
