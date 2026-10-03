import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { openDatabase } from "../db/openDatabase";
import {
  getConfigurationByKey,
  getConfigurations,
  saveConfiguration,
} from "./configurationRepository";

async function clearConfigurations(): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      "configuration",
      "readwrite",
    );

    const store =
      transaction.objectStore("configuration");

    store.clear();

    transaction.oncomplete = () => resolve();
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

describe("configuration repository", () => {
  beforeEach(async () => {
    await clearConfigurations();
  });

  it("saves and retrieves configuration", async () => {
    await saveConfiguration({
      configurationId: "config-1",
      key: "school.name",
      value: "Test School",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    const configurations =
      await getConfigurations();

    expect(configurations).toHaveLength(1);
    expect(configurations[0]?.key).toBe(
      "school.name",
    );
    expect(configurations[0]?.value).toBe(
      "Test School",
    );
  });

  it("finds configuration by key", async () => {
    await saveConfiguration({
      configurationId: "config-2",
      key: "attendance.mode",
      value: "offline",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    const configuration =
      await getConfigurationByKey(
        "attendance.mode",
      );

    expect(configuration).not.toBeNull();
    expect(configuration?.value).toBe("offline");
  });

  it("returns null for an unknown key", async () => {
    const configuration =
      await getConfigurationByKey(
        "does.not.exist",
      );

    expect(configuration).toBeNull();
  });
});
