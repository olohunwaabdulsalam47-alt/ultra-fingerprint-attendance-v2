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
  getPasswordCredential,
  savePasswordCredential,
} from "../../../data/repositories/passwordCredentialRepository";

const DEMO_STAFF_ID = "DEMO001";
const DEMO_PASSWORD = "Demo@12345";
const DEMO_SCHOOL_ID = "demo-school-001";

const LEGACY_TEST_STAFF_ID = "TestTrial@123";
const CORRECT_TEST_STAFF_ID = "TESTTRIAL001";

async function repairLegacyTestAccount(
  users: User[],
): Promise<User[]> {
  const legacyUser = users.find(
    (user) =>
      user.staffId?.trim().toLowerCase() ===
      LEGACY_TEST_STAFF_ID.toLowerCase(),
  );

  if (!legacyUser) {
    return users;
  }

  const repairedUser: User = {
    ...legacyUser,
    staffId: CORRECT_TEST_STAFF_ID,
    updatedAt: new Date().toISOString(),
  };

  await saveUser(repairedUser);

  // Repair the legacy test credential so the known
  // test password is definitely synchronized.
  const repairedCredential =
    await createPasswordCredential(
      repairedUser.userId,
      DEMO_PASSWORD,
    );

  await savePasswordCredential(
    repairedCredential,
  );

  return users.map((user) =>
    user.userId === repairedUser.userId
      ? repairedUser
      : user,
  );
}

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

    users = await repairLegacyTestAccount(users);

    const existingUser = users.find(
      (user) =>
        user.staffId?.trim().toLowerCase() ===
        DEMO_STAFF_ID.toLowerCase(),
    );

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        schoolId:
          existingUser.role === "SuperAdmin"
            ? existingUser.schoolId
            : DEMO_SCHOOL_ID,
        updatedAt: now,
      };

      await saveUser(updatedUser);

      const existingCredential =
        await getPasswordCredential(
          existingUser.userId,
        );

      if (!existingCredential) {
        const credential =
          await createPasswordCredential(
            existingUser.userId,
            DEMO_PASSWORD,
          );

        await savePasswordCredential(
          credential,
        );
      }

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
