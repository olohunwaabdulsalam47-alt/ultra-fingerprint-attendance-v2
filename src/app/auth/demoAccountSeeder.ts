import type { School } from "../../../domain/entities/school";
import type { User } from "../../../domain/entities/user";
import {
  getSchools,
  saveSchool,
} from "../../../data/repositories/schoolRepository";
import {
  getUsers,
  saveUser,
} from "../../../data/repositories/userRepository";
import {
  createPasswordCredential,
  savePasswordCredential,
} from "../../../data/repositories/passwordCredentialRepository";

const DEMO_STAFF_ID = "DEMO001";
const DEMO_PASSWORD = "Demo@12345";
const DEMO_SCHOOL_ID = "demo-school-001";

const TEST_STAFF_ID = "TESTTRIAL001";

export async function ensureDemoAccount(): Promise<void> {
  try {
    const now = new Date().toISOString();

    const schools = await getSchools();

    const existingSchool = schools.find(
      (school) =>
        school.schoolId === DEMO_SCHOOL_ID,
    );

    if (!existingSchool) {
      const demoSchool: School = {
        schoolId: DEMO_SCHOOL_ID,
        name: "ULTRA Demo School",
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      await saveSchool(demoSchool);
    }

    let users = await getUsers();

    /*
     * Repair the existing TESTTRIAL001 account.
     *
     * We deliberately recreate its password credential
     * every time during development initialization so the
     * known test password and stored credential cannot drift.
     */
    const testUser = users.find(
      (user) =>
        user.staffId?.trim().toLowerCase() ===
        TEST_STAFF_ID.toLowerCase(),
    );

    if (testUser) {
      const repairedUser: User = {
        ...testUser,
        staffId: TEST_STAFF_ID,
        schoolId:
          testUser.role === "SuperAdmin"
            ? testUser.schoolId
            : DEMO_SCHOOL_ID,
        updatedAt: now,
      };

      await saveUser(repairedUser);

      const credential =
        await createPasswordCredential(
          repairedUser.userId,
          DEMO_PASSWORD,
        );

      await savePasswordCredential(
        credential,
      );

      users = users.map((user) =>
        user.userId === repairedUser.userId
          ? repairedUser
          : user,
      );
    }

    /*
     * Keep the DEMO001 account available.
     */
    const existingDemoUser = users.find(
      (user) =>
        user.staffId?.trim().toLowerCase() ===
        DEMO_STAFF_ID.toLowerCase(),
    );

    if (existingDemoUser) {
      const updatedUser: User = {
        ...existingDemoUser,
        schoolId:
          existingDemoUser.role === "SuperAdmin"
            ? existingDemoUser.schoolId
            : DEMO_SCHOOL_ID,
        updatedAt: now,
      };

      await saveUser(updatedUser);

      const credential =
        await createPasswordCredential(
          updatedUser.userId,
          DEMO_PASSWORD,
        );

      await savePasswordCredential(
        credential,
      );

      return;
    }

    const demoUser: User = {
      userId: "demo-principal-user",
      schoolId: DEMO_SCHOOL_ID,
      role: "Principal",
      name: "Demo Principal",
      staffId: DEMO_STAFF_ID,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    await saveUser(demoUser);

    const credential =
      await createPasswordCredential(
        demoUser.userId,
        DEMO_PASSWORD,
      );

    await savePasswordCredential(
      credential,
    );
  } catch (error) {
    console.error(
      "Unable to initialize demo account:",
      error,
    );
  }
}
