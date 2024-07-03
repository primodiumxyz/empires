import { Address } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, test } from "vitest";

import { worldInput, worldsJson } from "@primodiumxyz/contracts";
import { createLocalAccount } from "@core/account/createLocalAccount";
import { createCore } from "@core/createCore";
import { CoreConfig } from "@core/index";
import { chainConfigs } from "@core/network/config/chainConfigs";
import { otherTableDefs } from "@core/network/otherTableDefs";

export const createTestConfig = () => {
  const isAnvilRunning = false;
  // const isIndexerRunning = false;

  const privateKey = generatePrivateKey();
  const address = privateKeyToAccount(privateKey).address;

  /* ---------------------------- Setup core config --------------------------- */
  const worlds = worldsJson as Partial<Record<string, { address: string; blockNumber?: number }>>;
  const worldAddress = worlds[chainConfigs.dev.id]?.address as Address;
  if (!worldAddress) throw new Error(`No world address found for chain ${chainConfigs.dev.id}.`);

  const coreConfig: CoreConfig = {
    chain: chainConfigs.dev,
    worldAddress,
    initialBlockNumber: BigInt(0),
    runSync: true,
    runSystems: true,
  };

  return {
    coreConfig,
    privateKey,
    address,
    isAnvilRunning,
  };
};

export const commonTests = () => {
  describe("common", () => {
    /* ----------------------------- Test Skip Flags ---------------------------- */

    const { coreConfig, privateKey, address } = createTestConfig();

    test("core contains mud tables", () => {
      const core = createCore(coreConfig);
      const coreTableKeys = Object.keys(core.tables);
      const mudTableKeys = Object.keys(worldInput.tables);
      const otherTableKeys = Object.keys(otherTableDefs);

      for (const table of [...otherTableKeys, ...mudTableKeys]) {
        expect(coreTableKeys).toContain(table);
      }
    });

    test("core contains identical config", () => {
      const core = createCore(coreConfig);

      expect(core.config).toEqual(coreConfig);
    });

    describe("account", () => {
      test("create local account", async () => {
        const account = createLocalAccount(coreConfig, privateKey);
        expect(account.address).toEqual(address);
      });
    });
  });
};
