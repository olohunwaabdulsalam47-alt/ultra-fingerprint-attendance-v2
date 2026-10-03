import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getConfigurationByKey,
  getConfigurations,
  saveConfiguration,
} from "./configurationRepository";

describe("configuration repository", () => {
  it("saves and retrieves configuration", async () => {
    const key = `school.name.${crypto.randomUUID()}`;

    await saveConfiguration({
      configurationId: crypto.randomUUID(),
      key,
      value: "Test School",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    const configurations =
      await getConfigurations();

    const savedConfiguration =
      configurations.find(
        (configuration) =>
          configuration.key === key,
      );

    expect(savedConfiguration).toBeDefined();
    expect(savedConfiguration?.value).toBe(
      "Test School",
    );
  });

  it("finds configuration by key", async () => {
    const key = `attendance.mode.${crypto.randomUUID()}`;

    await saveConfiguration({
      configurationId: crypto.randomUUID(),
      key,
      value: "offline",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    const configuration =
      await getConfigurationByKey(key);

    expect(configuration).not.toBeNull();
    expect(configuration?.key).toBe(key);
    expect(configuration?.value).toBe(
      "offline",
    );
  });

  it("returns null for an unknown key", async () => {
    const key = `does.not.exist.${crypto.randomUUID()}`;

    const configuration =
      await getConfigurationByKey(key);

    expect(configuration).toBeNull();
  });
});
