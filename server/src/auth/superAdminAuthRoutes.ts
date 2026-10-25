
import { Router, type Request, type Response, type NextFunction } from "express";
import { databasePool } from "../config/database.js";
import { authenticateSuperAdmin } from "./superAdminAuthService.js";
import {
  createPlatformSession,
  revokeSuperAdminSession,
} from "./sessionService.js";
import {
  createOtpChallenge,
  verifyOtpChallenge,
  type OtpPurpose,
} from "./otpService.js";
import { sendSuperAdminOtpSms } from "./termiiSmsService.js";
import { requireSuperAdmin } from "./superAdminAuthMiddleware.js";
import {
  createSecurityAccessGrant,
  revokeSecurityAccessGrants,
} from "./securityPageAccessService.js";
import { requireSecurityPageAccess } from "./securityPageAccessMiddleware.js";

const router = Router();

const SESSION_COOKIE = "ufa_session";
const SECURITY_ACCESS_COOKIE = "ufa_security_access";

const SESSION_MAX_AGE = 8 * 60 * 60 * 1000;
const SECURITY_ACCESS_MAX_AGE = 5 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const requestAttempts = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientKey(request: Request): string {
  return request.socket.remoteAddress ?? "unknown";
}

function isRateLimited(request: Request): boolean {
  const key = `${getClientKey(request)}:${request.path}`;
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

function invalidRequest(response: Response): void {
  response.status(400).json({
    success: false,
    message: "Invalid request.",
  });
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.cookie;
  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;

    if (part.slice(0, separator).trim() !== name) continue;

    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
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

function setSecurityAccessCookie(
  response: Response,
  token: string,
): void {
  response.cookie(SECURITY_ACCESS_COOKIE, token, {
    ...cookieOptions,
    maxAge: SECURITY_ACCESS_MAX_AGE,
  });
}

function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, cookieOptions);
}

function clearSecurityAccessCookie(response: Response): void {
  response.clearCookie(SECURITY_ACCESS_COOKIE, cookieOptions);
}

function validOtp(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

function validChallengeId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

/**
 * Protect cookie-authenticated POST requests against cross-site requests.
 * Configure FRONTEND_ORIGIN with the exact frontend origin, without a path.
 */
function requireTrustedOrigin(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (request.method !== "POST") {
    next();
    return;
  }

  const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origin = request.get("origin");

  if (
    configuredOrigins.length === 0 ||
    !origin ||
    !configuredOrigins.includes(origin)
  ) {
    response.status(403).json({
      success: false,
      message: "Request origin is not allowed.",
    });
    return;
  }

  next();
}

router.use(requireTrustedOrigin);

interface OtpChallengeOwner {
  platform_user_id: string;
  phone_number: string;
  purpose: OtpPurpose;
}

/**
 * Load the challenge owner before consuming the OTP.
 * The OTP service remains responsible for validating and consuming the code.
 */
async function getChallengeOwner(
  challengeId: string,
  purpose: OtpPurpose,
): Promise<OtpChallengeOwner | null> {
  const result = await databasePool.query<OtpChallengeOwner>(
    `SELECT platform_user_id, phone_number, purpose
     FROM platform_otp_challenges
     WHERE id = $1
       AND purpose = $2
       AND consumed_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [challengeId, purpose],
  );

  return result.rows[0] ?? null;
}

async function sendOtp(
  platformUserId: string,
  phoneNumber: string,
  purpose: OtpPurpose,
): Promise<{ challengeId: string; expiresAt: Date } | null> {
  const challenge = await createOtpChallenge(
    platformUserId,
    phoneNumber,
    purpose,
  );

  const delivery = await sendSuperAdminOtpSms(
    phoneNumber,
    challenge.otpCode,
  );

  if (!delivery.success) {
    return null;
  }

  return {
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
  };
}

/**
 * Step 1: Initial Staff ID gate.
 * Successful validation only directs the frontend to the separate login page.
 * It does not issue an OTP or create a session.
 */
router.post("/entry", async (request, response) => {
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
    response.status(503).json({
      success: false,
      message: "Unable to continue. Please try again.",
    });
  }
});

/**
 * Step 2: Registered phone number + password.
 * A successful check sends a SUPERADMIN_LOGIN OTP.
 */
router.post("/login", async (request, response) => {
  if (isRateLimited(request)) {
    rejectRateLimitedRequest(response);
    return;
  }

  const { phoneNumber, password } = request.body ?? {};

  if (
    typeof phoneNumber !== "string" ||
    !/^\+[1-9]\d{7,14}$/.test(phoneNumber) ||
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 1024
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

    const challenge = await sendOtp(
      account.id,
      account.phoneNumber,
      "SUPERADMIN_LOGIN",
    );

    if (!challenge) {
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
    response.status(503).json({
      success: false,
      message: "Unable to start login. Please try again.",
    });
  }
});

/**
 * Step 3: Verify the login OTP, then create a server-side session.
 */
router.post("/verify-otp", async (request, response) => {
  if (isRateLimited(request)) {
    rejectRateLimitedRequest(response);
    return;
  }

  const { challengeId, otp } = request.body ?? {};

  if (!validChallengeId(challengeId) || !validOtp(otp)) {
    invalidRequest(response);
    return;
  }

  try {
    const owner = await getChallengeOwner(
      challengeId,
      "SUPERADMIN_LOGIN",
    );

    if (!owner) {
      response.status(401).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
      return;
    }

    const verification = await verifyOtpChallenge(
      challengeId,
      otp,
      "SUPERADMIN_LOGIN",
    );

    if (verification !== "VERIFIED") {
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
      [owner.platform_user_id],
    );

    const account = accountResult.rows[0];

    if (
      !account ||
      !account.phone_number ||
      account.phone_number !== owner.phone_number
    ) {
      response.status(401).json({
        success: false,
        message: "Account verification failed.",
      });
      return;
    }

    // Device trust is deliberately omitted until its token lifecycle
    // is implemented end-to-end. Every login requires OTP verification.
    const session = await createPlatformSession(account.id, null);

    clearSecurityAccessCookie(response);
    setSessionCookie(response, session.sessionToken);

    response.status(200).json({
      success: true,
      user: {
        id: account.id,
        fullName: account.full_name,
        phoneNumber: account.phone_number,
        role: "SUPER_ADMIN",
      },
      expiresAt: session.expiresAt,
    });
  } catch {
    response.status(503).json({
      success: false,
      message: "Unable to verify code. Please try again.",
    });
  }
});

/**
 * Request a fresh OTP for Security & Privacy.
 */
router.post(
  "/security/request-otp",
  requireSuperAdmin,
  async (_request, response) => {
    if (isRateLimited(_request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const platformUserId = response.locals.superAdminId as
      | string
      | undefined;
    const sessionToken = readCookie(_request, SESSION_COOKIE);

    if (!platformUserId || !sessionToken) {
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
        [platformUserId],
      );

      const phoneNumber = accountResult.rows[0]?.phone_number;

      if (!phoneNumber) {
        response.status(403).json({
          success: false,
          message: "A registered phone number is required.",
        });
        return;
      }

      await revokeSecurityAccessGrants(sessionToken);

      const challenge = await sendOtp(
        platformUserId,
        phoneNumber,
        "SECURITY_PAGE_ACCESS",
      );

      if (!challenge) {
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
      response.status(503).json({
        success: false,
        message: "Unable to request verification code.",
      });
    }
  },
);

/**
 * Verify the second OTP and create a grant tied to this exact session.
 */
router.post(
  "/security/verify-otp",
  requireSuperAdmin,
  async (request, response) => {
    if (isRateLimited(request)) {
      rejectRateLimitedRequest(response);
      return;
    }

    const platformUserId = response.locals.superAdminId as
      | string
      | undefined;
    const sessionToken = readCookie(request, SESSION_COOKIE);
    const { challengeId, otp } = request.body ?? {};

    if (
      !platformUserId ||
      !sessionToken ||
      !validChallengeId(challengeId) ||
      !validOtp(otp)
    ) {
      invalidRequest(response);
      return;
    }

    try {
      const owner = await getChallengeOwner(
        challengeId,
        "SECURITY_PAGE_ACCESS",
      );

      if (
        !owner ||
        owner.platform_user_id !== platformUserId
      ) {
        response.status(401).json({
          success: false,
          message: "Invalid or expired verification code.",
        });
        return;
      }

      const verification = await verifyOtpChallenge(
        challengeId,
        otp,
        "SECURITY_PAGE_ACCESS",
      );

      if (verification !== "VERIFIED") {
        response.status(401).json({
          success: false,
          message: "Invalid or expired verification code.",
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
        expiresAt: grant.expiresAt,
        message: "Security page access granted.",
      });
    } catch {
      response.status(503).json({
        success: false,
        message: "Unable to verify code. Please try again.",
      });
    }
  },
);

/**
 * This endpoint succeeds only when both the login session and the
 * short-lived, session-bound Security & Privacy grant are valid.
 */
router.get(
  "/security/access",
  requireSuperAdmin,
  requireSecurityPageAccess,
  (_request, response) => {
    response.status(200).json({
      success: true,
      access: true,
    });
  },
);

/**
 * Return the current SuperAdmin account.
 */
router.get("/me", requireSuperAdmin, async (_request, response) => {
  const platformUserId = response.locals.superAdminId as
    | string
    | undefined;

  if (!platformUserId) {
    response.status(401).json({
      success: false,
      message: "Authentication is required.",
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
      [platformUserId],
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
    response.status(503).json({
      success: false,
      message: "Unable to load account.",
    });
  }
});

/**
 * Revoke the current session and its grants, then clear the cookies.
 */
router.post("/logout", async (request, response) => {
  const sessionToken = readCookie(request, SESSION_COOKIE);

  try {
    if (sessionToken) {
      await revokeSecurityAccessGrants(sessionToken);
      await revokeSuperAdminSession(sessionToken);
    }

    clearSessionCookie(response);
    clearSecurityAccessCookie(response);

    response.status(200).json({
      success: true,
      message: "Signed out.",
    });
  } catch {
    response.status(503).json({
      success: false,
      message: "Unable to sign out. Please try again.",
    });
  }
});

export default router;
    
