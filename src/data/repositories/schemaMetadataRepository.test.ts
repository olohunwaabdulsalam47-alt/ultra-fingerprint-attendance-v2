import {
  describe,
  expect,
  it,
} from "vitest";
import {
  getSchemaMetadata,
  saveSchemaMetadata,
} from "./schemaMetadataRepository";

describe("schema metadata repository", () => {
  it("saves and retrieves schema metadata", async () => {
    const schemaMetadataId =
      `schema-${crypto.randomUUID()}`;

    await saveSchemaMetadata({
      schemaMetadataId,
      version: 1,
      description: "Initial database schema",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    const metadata =
      await getSchemaMetadata();

    const savedMetadata = metadata.find(
      (item) =>
        item.schemaMetadataId ===
        schemaMetadataId,
    );

    expect(savedMetadata).toBeDefined();
    expect(savedMetadata?.version).toBe(1);
    expect(savedMetadata?.description).toBe(
      "Initial database schema",
    );
  });

  it("can store different schema versions", async () => {
    const firstId =
      `schema-${crypto.randomUUID()}`;

    const secondId =
      `schema-${crypto.randomUUID()}`;

    await saveSchemaMetadata({
      schemaMetadataId: firstId,
      version: 1,
      description: "Version one",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    await saveSchemaMetadata({
      schemaMetadataId: secondId,
      version: 2,
      description: "Version two",
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    });

    const metadata =
      await getSchemaMetadata();

    expect(
      metadata.some(
        (item) =>
          item.schemaMetadataId === firstId &&
          item.version === 1,
      ),
    ).toBe(true);

    expect(
      metadata.some(
        (item) =>
          item.schemaMetadataId === secondId &&
          item.version === 2,
      ),
    ).toBe(true);
  });
});
