import type { AuthSession } from "../../../domain/entities/authSession";
import { getUsers } from "../../../data/repositories/userRepository";
import {
  getPasswordCredential,
  verifyPassword,
} from "../../../data/repositories/passwordCredentialRepository";

interface AuthenticationResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export async function authenticateUser(
  staffId: string,
  password: string,
): Promise<AuthenticationResult> {
  const normalizedStaffId = staffId.trim();

  if (!normalizedStaffId || !password) {
    return {
      success: false,
      error: "Staff ID and password are required.",
    };
  }

  try {
    const users = await getUsers();

    const user = users.find(
      (item) =>
        item.staffId?.trim().toLowerCase() ===
        normalizedStaffId.toLowerCase(),
    );

    if (!user) {
      return {
        success: false,
        error: "Invalid Staff ID or password.",
      };
    }

    if (user.status !== "active") {
      return {
        success: false,
        error: "This user account is inactive.",
      };
    }

    const credential = await getPasswordCredential(
      user.userId,
    );

    if (!credential) {
      return {
        success: false,
        error:
          "This user does not have a password configured.",
      };
    }

    const validPassword = await verifyPassword(
      password,
      credential,
    );

    if (!validPassword) {
      return {
        success: false,
        error: "Invalid Staff ID or password.",
      };
    }

    const session: AuthSession = {
      userId: user.userId,
      staffId: user.staffId ?? normalizedStaffId,
      name: user.name,
      role: user.role,
      loginMethod: "PASSWORD",
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      session,
    };
  } catch {
    return {
      success: false,
      error: "Unable to authenticate the user.",
    };
  }
}
