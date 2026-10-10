import type { NextFunction, Request, Response } from "express";
import { validateSecurityAccessGrant } from "./securityPageAccessService.js";

const SESSION_COOKIE = "ufa_session";
const SECURITY_ACCESS_COOKIE = "ufa_security_access";

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

/**
 * Protects SuperAdmin security-page endpoints.
 *
 * Both the normal login session and the additional security
 * access grant must be valid and belong to the same session.
 *
 * This middleware does not issue OTPs or grant access by itself.
 */
export async function requireSecurityPageAccess(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const sessionToken = readCookie(request, SESSION_COOKIE);
  const grantToken = readCookie(request, SECURITY_ACCESS_COOKIE);

  if (!sessionToken || !grantToken) {
    response.status(401).json({
      success: false,
      code: "SECURITY_PAGE_OTP_REQUIRED",
      message:
        "Security-page verification is required. Please verify a fresh OTP.",
    });
    return;
  }

  try {
    const platformUserId = await validateSecurityAccessGrant(
      grantToken,
      sessionToken,
    );

    if (!platformUserId) {
      response.status(401).json({
        success: false,
        code: "SECURITY_PAGE_OTP_REQUIRED",
        message:
          "Security access is invalid or has expired. Please verify a fresh OTP.",
      });
      return;
    }

    response.locals.superAdminId = platformUserId;
    response.locals.securityPageAccessVerified = true;

    next();
  } catch {
    response.status(503).json({
      success: false,
      code: "SECURITY_ACCESS_UNAVAILABLE",
      message:
        "Security access could not be verified. Please try again.",
    });
  }
}
