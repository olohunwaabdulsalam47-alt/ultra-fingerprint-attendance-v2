import type { User } from "../../domain/entities/user";
import { openDatabase } from "../db/openDatabase";

const STORE_NAME = "users";

export async function saveUser(
  user: User,
): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      STORE_NAME,
      "readwrite",
    );

    const store =
      transaction.objectStore(STORE_NAME);

    store.put(
      user,
      user.userId,
    );

    transaction.oncomplete = () =>
      resolve();

    transaction.onerror = () =>
      reject(transaction.error);

    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error("Transaction aborted"),
      );
  });

  db.close();
}

export async function getUsers(): Promise<User[]> {
  const db = await openDatabase();

  const users =
    await new Promise<User[]>(
      (resolve, reject) => {
        const transaction =
          db.transaction(
            STORE_NAME,
            "readonly",
          );

        const store =
          transaction.objectStore(
            STORE_NAME,
          );

        const request =
          store.getAll();

        request.onsuccess = () =>
          resolve(
            request.result as User[],
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return users;
}

export async function getUsersBySchool(
  schoolId: string,
): Promise<User[]> {
  const selectedSchoolId =
    schoolId.trim();

  if (!selectedSchoolId) {
    return [];
  }

  const users =
    await getUsers();

  return users.filter(
    (user) =>
      user.schoolId ===
      selectedSchoolId,
  );
}

export async function getActiveUsersBySchool(
  schoolId: string,
): Promise<User[]> {
  const users =
    await getUsersBySchool(
      schoolId,
    );

  return users.filter(
    (user) =>
      user.status === "active",
  );
}

export async function getUserById(
  userId: string,
): Promise<User | null> {
  const db = await openDatabase();

  const user =
    await new Promise<User | null>(
      (resolve, reject) => {
        const transaction =
          db.transaction(
            STORE_NAME,
            "readonly",
          );

        const store =
          transaction.objectStore(
            STORE_NAME,
          );

        const request =
          store.get(userId);

        request.onsuccess = () =>
          resolve(
            (request.result as
              | User
              | undefined) ??
              null,
          );

        request.onerror = () =>
          reject(request.error);
      },
    );

  db.close();

  return user;
}

export async function getUserByIdForSchool(
  userId: string,
  schoolId: string,
): Promise<User | null> {
  const selectedSchoolId =
    schoolId.trim();

  if (!selectedSchoolId) {
    return null;
  }

  const user =
    await getUserById(userId);

  if (!user) {
    return null;
  }

  if (
    user.schoolId !==
    selectedSchoolId
  ) {
    return null;
  }

  return user;
}

export async function getUsersByRoleForSchool(
  schoolId: string,
  role: User["role"],
): Promise<User[]> {
  const users =
    await getUsersBySchool(
      schoolId,
    );

  return users.filter(
    (user) =>
      user.role === role,
  );
}

export async function getActiveUsersByRoleForSchool(
  schoolId: string,
  role: User["role"],
): Promise<User[]> {
  const users =
    await getUsersByRoleForSchool(
      schoolId,
      role,
    );

  return users.filter(
    (user) =>
      user.status === "active",
  );
}

export async function getUserByStaffId(
  staffId: string,
): Promise<User | null> {
  const selectedStaffId =
    staffId.trim();

  if (!selectedStaffId) {
    return null;
  }

  const users =
    await getUsers();

  return (
    users.find(
      (user) =>
        user.staffId ===
        selectedStaffId,
    ) ?? null
  );
}

export async function getUserByStaffIdForSchool(
  staffId: string,
  schoolId: string,
): Promise<User | null> {
  const selectedSchoolId =
    schoolId.trim();

  if (!selectedSchoolId) {
    return null;
  }

  const user =
    await getUserByStaffId(
      staffId,
    );

  if (!user) {
    return null;
  }

  if (
    user.schoolId !==
    selectedSchoolId
  ) {
    return null;
  }

  return user;
}
