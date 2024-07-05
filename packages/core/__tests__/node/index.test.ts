import { describe, expect, test } from "vitest";

import { createExternalAccount } from "@core/account";

import { commonTests, createTestConfig } from "../lib/common";

describe("node", () => {
  const { coreConfig, privateKey } = createTestConfig();

  commonTests();

  describe("node-only", () => {
    test("cannot create external account", async () => {
      expect(() => createExternalAccount(coreConfig, privateKey)).toThrowError(
        "createExternalAccount must be called in a browser environment",
      );
    });
  });
});
