import type { NextFunction, Request, Response } from "express";

import { validateSuperAdminSession } from "./sessionService.js";

const SESSION_COOKIE = "ufa_session";

function readSessionCookie(request: Request): string | null {
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

    if (name !== SESSION_COOKIE) {
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
 * Protects SuperAdmin endpoints by validating the server-side session.
 *
 * Successful authentication places the SuperAdmin ID in:
 * response.locals.superAdminId
 */
export async function requireSuperAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const sessionToken = readSessionCookie(request);

  if (!sessionToken) {
    response.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
    return;
  }

  try {
    const platformUserId =
      await validateSuperAdminSession(sessionToken);

    if (!platformUserId) {
      response.status(401).json({
        success: false,
        message: "Your session is invalid or has expired. Please log in again.",
      });
      return;
    }

    response.locals.superAdminId = platformUserId;

    next();
  } catch {
    response.status(503).json({
      success: false,
      message: "Authentication could not be verified. Please try again.",
    });
  }
}
