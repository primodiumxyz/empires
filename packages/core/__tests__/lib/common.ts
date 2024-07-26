import { Address, Hex, TransactionReceipt } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { beforeAll, describe, expect, test } from "vitest";
import { worldInput } from "@primodiumxyz/contracts/mud.config";
import worldsJson from "@primodiumxyz/contracts/worlds.json";

import { createLocalAccount } from "@core/account/createLocalAccount";
import { createCore } from "@core/createCore";
import { Core, CoreConfig, SyncStep } from "@core/index";
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

    const { coreConfig, privateKey, address, isAnvilRunning } = createTestConfig();

    test("core contains mud tables", () => {
      const core = createCore(coreConfig);
      const coreTableKeys = Object.keys(core.tables);
      const mudTableKeys = Object.keys(worldInput.tables);
      const otherTableKeys = Object.keys(otherTableDefs);

      for (const table of [...otherTableKeys, ...mudTableKeys]) {
        expect(coreTableKeys).toContain(table);
      }
    });

    test("core contains random utility", () => {
      const core = createCore(coreConfig);

      expect(core.utils).toEqual({});
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

    describe.skipIf(!isAnvilRunning)("live game tests", () => {
      let core: Core;

      beforeAll(async () => {
        core = createCore(coreConfig);
        await waitUntilSynced();
      });

      const waitUntilSynced = async () => {
        let syncStatus = core.tables.SyncStatus.get()?.step ?? SyncStep.Syncing;

        while (syncStatus !== SyncStep.Live) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          syncStatus = core.tables.SyncStatus.get()?.step ?? SyncStep.Syncing;
        }
      };

      const waitUntilTxExecution = async (txHash: Hex) => {
        const publicClient = core.network.publicClient;

        const pollForReceipt = async (): Promise<TransactionReceipt> => {
          console.log("polling for receipt");
          try {
            let receipt = await publicClient.getTransactionReceipt({ hash: txHash });
            console.log({ receipt });
            while (receipt === undefined) {
              await new Promise((resolve) => setTimeout(resolve, 400));
              receipt = await publicClient.getTransactionReceipt({ hash: txHash });
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return receipt;
          } catch (error) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            return pollForReceipt();
          }
        };

        return pollForReceipt();
      };

      test("update counter", async () => {
        const account = createLocalAccount(coreConfig, privateKey);

        const txHash = await account.worldContract.write.Primodium_Base__increment();
        await waitUntilTxExecution(txHash);

        const counter = core.tables.Counter.get()?.value ?? 0n;
        expect(counter).toEqual(1n);
      });
    });
  });
};
