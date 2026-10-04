import type { User } from "../../../domain/entities/user";
import { getUsers, saveUser } from "../../../data/repositories/userRepository";
import {
  createPasswordCredential,
  getPasswordCredential,
  savePasswordCredential,
} from "../../../data/repositories/passwordCredentialRepository";

const DEMO_STAFF_ID = "DEMO001";
const DEMO_PASSWORD = "Demo@12345";

export async function ensureDemoAccount(): Promise<void> {
  try {
    const users = await getUsers();

    const existingUser = users.find(
      (user) =>
        user.staffId?.trim().toLowerCase() ===
        DEMO_STAFF_ID.toLowerCase(),
    );

    if (existingUser) {
      const existingCredential = await getPasswordCredential(
        existingUser.userId,
      );

      if (!existingCredential) {
        const credential = await createPasswordCredential(
          existingUser.userId,
          DEMO_PASSWORD,
        );

        await savePasswordCredential(credential);
      }

      return;
    }

    const now = new Date().toISOString();

    const demoUser: User = {
      userId: "demo-principal-user",
      schoolId: null,
      role: "Principal",
      name: "Demo Principal",
      staffId: DEMO_STAFF_ID,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    await saveUser(demoUser);

    const credential = await createPasswordCredential(
      demoUser.userId,
      DEMO_PASSWORD,
    );

    await savePasswordCredential(credential);
  } catch (error) {
    console.error("Unable to initialize demo account:", error);
  }
}
