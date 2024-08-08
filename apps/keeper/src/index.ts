import {
  Core,
  createCore,
  createLocalAccount,
  SyncStep,
} from "@primodiumxyz/core";
import { getCoreConfig } from "../src/getCoreConfig";
import { updateWorld } from "./contractCalls/updateWorld";

async function main() {
  const { core, deployerAccount } = await setup();

  let updating = false;
  core.tables.BlockNumber.watch({
    onChange: async ({ properties: { current } }) => {
      const txQueueSize = core.tables.TransactionQueue.getSize();

      if (txQueueSize > 0 || updating) {
        console.info("SKIPPING: transaction in progress");
        return;
      }

      const endBlock = core.tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
      const blocksLeft = endBlock - (current?.value ?? 0n);
      const gameOver = blocksLeft <= 0n;
      if (gameOver) {
        console.info("SKIPPING: game over");
        return;
      }

      const nextTurnBlock = core.tables.Turn.get()?.nextTurnBlock ?? 0n;
      if ((current?.value ?? 0n) < nextTurnBlock) {
        console.info(
          `SKIPPING: current block ${current?.value} next turn block ${nextTurnBlock}`
        );
        return;
      }
      updating = true;
      await updateWorld(core, deployerAccount, () => {
        updating = false;
      });
    },
  });
}

async function setup() {
  const config = getCoreConfig();
  const core = createCore(config);
  const deployerKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!deployerKey) {
    throw new Error("PRIVATE_KEY is not set");
  }
  const deployerAccount = createLocalAccount(config, deployerKey);
  await awaitSync(core);
  return { core, deployerAccount };
}

function awaitSync(core: Core) {
  return new Promise((resolve) => {
    core.tables.SyncStatus.watch({
      onChange: ({ properties: { current } }) => {
        if (current?.step === SyncStep.Complete) {
          resolve(current);
        }
      },
    });
  });
}

main();
