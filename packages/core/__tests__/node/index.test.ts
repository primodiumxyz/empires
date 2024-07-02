import { describe, expect, test } from "vitest";
import { commonTests, createTestConfig } from "../lib/common";
import { createExternalAccount } from "@/account";

describe("node", () => {
  const { coreConfig, privateKey } = createTestConfig();

  commonTests();

  describe("node-only", () => {
    test("cannot create external account", async () => {
      expect(() => createExternalAccount(coreConfig, privateKey)).toThrowError(
        "createExternalAccount must be called in a browser environment"
      );
    });
  });
});
