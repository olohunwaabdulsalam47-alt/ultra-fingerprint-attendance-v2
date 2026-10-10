import { Router, type Request, type Response } from "express";
import { databasePool } from "../config/database.js";
import { authenticateSuperAdmin } from "./superAdminAuthService.js";
import {
  createPlatformSession,
  revokeSuperAdminSession,
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
import { requireSuperAdmin } from "./superAdminAuthMiddleware.js";
import {
  createSecurityAccessGrant,
  revokeSecurityAccessGrants,
} from "./securityPageAccessService.js";
import {
  requireSecurityPageAccess,
} from "./securityPageAccessMiddleware.js";

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

function rejectRateLimitedRequest(response: Response): void {
  response.setHeader("Retry-After", "900");

  response.status(429).json({
    success: false,
    message: "Too many attempts. Please try again later.",
  });
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

function setSecurityAccessCookie(
  response: Response,
  grantToken: string,
): void {
  response.cookie(SECURITY_ACCESS_COOKIE, grantToken, {
    ...cookieOptions,
    maxAge: SECURITY_ACCESS_MAX_AGE,
  });
}

function clearAuthenticationCookies(response: Response): void {
  response.clearCookie(SESSION_COOKIE, cookieOptions);
  response.clearCookie(DEVICE_COOKIE, cookieOptions);
  response.clearCookie(SECURITY_ACCESS_COOKIE, cookieOptions);
}

function invalidRequest(response: Response): void {
  response.status(400).json({
    success: false,
    message: "Please check the information provided.",
  });
}

function isValidChallengeId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isValidOtp(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

/**
 * POST /api/superadmin/login
 *
 * Requires a valid SuperAdmin phone number and password.
 * A login OTP must then be verified.
 *
 * Trusted devices do not bypass OTP verification.
 */
router.post(
  "/login",
  async (request: Request, response: Response) => {
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
      password.length > 256 ||
      (deviceName !== undefined &&
        (typeof deviceName !== "string" ||
          deviceName.length > 120))
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

      const challenge = await createOtpChallenge(
        user.id,
        user.phoneNumber,
        "SUPERADMIN_LOGIN",
      );

      const delivery = await sendSuperAdminOtpSms(
        user.phoneNumber,
        challenge.otpCode,
      );

      if (!delivery.success) {
        response.status(503).json({
          success: false,
          message:
            "Verification SMS could not be sent. Please try again.",
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
 * Verifies the OTP issued specifically for SuperAdmin login.
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
        (typeof deviceName !== "string" ||
          deviceName.length > 120))
    ) {
      invalidRequest(response);
      return;
    }

    try {
      const verification = await verifyOtpChallenge(
        challengeId,
        otp,
        "SUPERADMIN_LOGIN",
      );

      if (verification !== "VERIFIED") {
        const statusCode = verification === "LOCKED" ? 429 : 401;

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

      const challengeResult = await databasePool.query<{
        platform_user_id: string;
        phone_number: string;
      }>(
        `
          SELECT
            c.platform_user_id,
            c.phone_number
          FROM platform_otp_challenges AS c
          INNER JOIN platform_users AS u
            ON u.id = c.platform_user_id
          WHERE c.id = $1
            AND c.consumed_at IS NOT NULL
            AND c.purpose = 'SUPERADMIN_LOGIN'
            AND u.role = 'SUPER_ADMIN'
            AND u.is_active = TRUE
            AND u.phone_number = c.phone_number
          LIMIT 1
        `,
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
        `
          INSERT INTO platform_trusted_devices (
            platform_user_id,
            device_token_hash,
            device_name,
            expires_at
          )
          VALUES (
            $1,
            $2,
            $3,
            NOW() + INTERVAL '30 days'
          )
          RETURNING id
        `,
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

      // Logging in does not automatically authorize the security page.
      response.clearCookie(SECURITY_ACCESS_COOKIE, cookieOptions);

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
 * POST /api/superadmin/security/request-otp
 *
 * Requires a valid SuperAdmin login session.
 * Requests a separate OTP for security-page access.
 */
router.post(
  "/security/request-otp",
  requireSuperAdmin,
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const platformUserId = response.locals.superAdminId;
    const sessionToken = readCookie(request, SESSION_COOKIE);

    if (!sessionToken) {
      response.status(401).json({
        success: false,
        message: "Please log in again.",
      });
      return;
    }

    try {
      const userResult = await databasePool.query<{
        id: string;
        phone_number: string;
      }>(
        `
          SELECT id, phone_number
          FROM platform_users
          WHERE id = $1
            AND role = 'SUPER_ADMIN'
            AND is_active = TRUE
            AND phone_number IS NOT NULL
          LIMIT 1
        `,
        [platformUserId],
      );

      const user = userResult.rows[0];

      // Corrected E.164 phone-number validation.
      if (
        !user ||
        !/^\+[1-9]\d{7,14}$/.test(user.phone_number)
      ) {
        response.status(400).json({
          success: false,
          message:
            "A valid registered SuperAdmin phone number is required.",
        });
        return;
      }

      // Remove the previous browser grant immediately.
      response.clearCookie(SECURITY_ACCESS_COOKIE, cookieOptions);

      await revokeSecurityAccessGrants(sessionToken);

      const challenge = await createOtpChallenge(
        user.id,
        user.phone_number,
        "SECURITY_PAGE_ACCESS",
      );

      const delivery = await sendSuperAdminOtpSms(
        user.phone_number,
        challenge.otpCode,
      );

      if (!delivery.success) {
        response.status(503).json({
          success: false,
          message:
            "Security verification SMS could not be sent. Please try again.",
        });
        return;
      }

      response.status(202).json({
        success: true,
        requiresOtp: true,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        message:
          "A security verification code has been sent to your registered phone.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message:
          "Security verification could not be started. Please try again.",
      });
    }
  },
);

/**
 * POST /api/superadmin/security/verify-otp
 *
 * Verifies a separate security-page OTP and issues a short-lived
 * grant bound to the current authenticated session.
 */
router.post(
  "/security/verify-otp",
  requireSuperAdmin,
  async (request: Request, response: Response) => {
    if (isRateLimited(request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const { challengeId, otp } = request.body ?? {};

    if (!isValidChallengeId(challengeId) || !isValidOtp(otp)) {
      invalidRequest(response);
      return;
    }

    const platformUserId = response.locals.superAdminId;
    const sessionToken = readCookie(request, SESSION_COOKIE);

    if (!sessionToken) {
      response.status(401).json({
        success: false,
        message: "Please log in again.",
      });
      return;
    }

    try {
      const verification = await verifyOtpChallenge(
        challengeId,
        otp,
        "SECURITY_PAGE_ACCESS",
      );

      if (verification !== "VERIFIED") {
        const statusCode = verification === "LOCKED" ? 429 : 401;

        response.status(statusCode).json({
          success: false,
          message:
            verification === "EXPIRED"
              ? "The security verification code has expired. Request a new one."
              : verification === "LOCKED"
                ? "Too many incorrect codes. Request a new verification code."
                : verification === "ALREADY_USED"
                  ? "This security verification code has already been used."
                  : "The security verification code is invalid.",
        });
        return;
      }

      const challengeResult = await databasePool.query<{
        platform_user_id: string;
        phone_number: string;
      }>(
        `
          SELECT
            c.platform_user_id,
            c.phone_number
          FROM platform_otp_challenges AS c
          INNER JOIN platform_users AS u
            ON u.id = c.platform_user_id
          WHERE c.id = $1
            AND c.consumed_at IS NOT NULL
            AND c.purpose = 'SECURITY_PAGE_ACCESS'
            AND c.platform_user_id = $2
            AND u.role = 'SUPER_ADMIN'
            AND u.is_active = TRUE
            AND u.phone_number = c.phone_number
          LIMIT 1
        `,
        [challengeId, platformUserId],
      );

      const verifiedChallenge = challengeResult.rows[0];

      if (!verifiedChallenge) {
        response.status(401).json({
          success: false,
          message:
            "The security verification could not be completed.",
        });
        return;
      }

      const grant = await createSecurityAccessGrant(
        platformUserId,
        sessionToken,
      );

      setSecurityAccessCookie(response, grant.grantToken);

      response.status(200).json({
        success: true,
        securityAccessGranted: true,
        expiresAt: grant.expiresAt,
        message:
          "Security verification successful. Temporary access has been granted.",
      });
    } catch {
      response.status(500).json({
        success: false,
        message:
          "Security verification could not be completed. Please try again.",
      });
    }
  },
);

/**
 * GET /api/superadmin/security/access
 *
 * Requires both an active login session and a valid security grant.
 */
router.get(
  "/security/access",
  requireSuperAdmin,
  requireSecurityPageAccess,
  (_request: Request, response: Response) => {
    response.status(200).json({
      success: true,
      securityAccessGranted: true,
      message: "Security-page access is verified.",
    });
  },
);

/**
 * GET /api/superadmin/me
 *
 * Returns the current active SuperAdmin account.
 */
router.get(
  "/me",
  requireSuperAdmin,
  async (_request: Request, response: Response) => {
    const platformUserId = response.locals.superAdminId;

    try {
      const result = await databasePool.query<{
        id: string;
        full_name: string;
        phone_number: string;
      }>(
        `
          SELECT id, full_name, phone_number
          FROM platform_users
          WHERE id = $1
            AND role = 'SUPER_ADMIN'
            AND is_active = TRUE
          LIMIT 1
        `,
        [platformUserId],
      );

      const user = result.rows[0];

      if (!user) {
        response.status(401).json({
          success: false,
          message: "The SuperAdmin account is no longer active.",
        });
        return;
      }

      response.status(200).json({
        success: true,
        user: {
          id: user.id,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          role: "SUPER_ADMIN",
        },
      });
    } catch {
      response.status(500).json({
        success: false,
        message: "Unable to retrieve the account.",
      });
    }
  },
);

/**
 * POST /api/superadmin/logout
 *
 * Revokes the current server-side session and its security grants,
 * then clears authentication cookies.
 */
router.post(
  "/logout",
  async (request: Request, response: Response) => {
    const sessionToken = readCookie(request, SESSION_COOKIE);

    try {
      if (sessionToken) {
        await revokeSecurityAccessGrants(sessionToken);
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
