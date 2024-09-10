import { Hex } from "viem";

import {
  ChainConfig,
  Core,
  createCore,
  createLocalAccount,
  execute,
  LocalAccount,
  SyncStep,
  Tables,
  TxReceipt,
} from "@primodiumxyz/core";

export class KeeperService {
  private keeperPrivateKey: Hex;
  private running: boolean = false;
  private unsubscribe: (() => void) | null = null;

  constructor(keeperPrivateKey: Hex) {
    this.keeperPrivateKey = keeperPrivateKey;
  }

  async start(chain: ChainConfig, worldAddress: Hex, initialBlockNumber: bigint): Promise<boolean> {
    if (this.running) return await this.stop();

    try {
      this.running = true;
      this.run(chain, worldAddress, initialBlockNumber);
      return true;
    } catch (error) {
      console.error("Failed to start keeper:", error);
      return false;
    }
  }

  async stop(): Promise<boolean> {
    if (!this.running) return true;

    try {
      if (this.unsubscribe) this.unsubscribe();
      this.running = false;
      return true;
    } catch (error) {
      console.error("Failed to stop keeper:", error);
      return false;
    }
  }

  getStatus(): { running: boolean } {
    return { running: this.running };
  }

  private async run(chain: ChainConfig, worldAddress: Hex, initialBlockNumber: bigint): Promise<void> {
    const { core, deployerAccount } = await this.setupCore(chain, worldAddress, initialBlockNumber);

    let updating = false;
    this.unsubscribe = core.tables.BlockNumber.watch({
      onChange: async ({ properties: { current } }) => {
        const ready = core.tables.Ready.get()?.value ?? false;
        const endBlock = core.tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
        const blocksLeft = endBlock - (current?.value ?? 0n);
        const gameOver = blocksLeft <= 0n;

        if (!ready || gameOver) {
          console.info("SKIPPING: not ready or game over");
          return;
        }

        const txQueueSize = core.tables.TransactionQueue.getSize();
        if (txQueueSize > 0 || updating) {
          console.info("SKIPPING: transaction in progress");
          return;
        }

        const nextTurnBlock = core.tables.Turn.get()?.nextTurnBlock ?? 0n;
        if ((current?.value ?? 0n) < nextTurnBlock) {
          console.info(`SKIPPING: current block ${current?.value} next turn block ${nextTurnBlock}`);
          return;
        }

        updating = true;
        await this.updateWorld(core, deployerAccount, () => {
          updating = false;
        });
      },
    });
  }

  private async setupCore(
    chain: ChainConfig,
    worldAddress: Hex,
    initialBlockNumber: bigint,
  ): Promise<{ core: Core; deployerAccount: LocalAccount }> {
    const core = createCore({
      chain,
      worldAddress: worldAddress,
      initialBlockNumber: initialBlockNumber,
      runSync: true,
      runSystems: true,
    });
    const deployerAccount = createLocalAccount(core.config, this.keeperPrivateKey);
    await this.awaitSync(core.tables);

    return { core, deployerAccount };
  }

  private async awaitSync(tables: Tables): Promise<void> {
    return new Promise((resolve) => {
      tables.SyncStatus.watch({
        onChange: ({ properties: { current } }) => {
          if (current?.step === SyncStep.Complete) {
            resolve();
          }
        },
      });
    });
  }

  private async updateWorld(core: Core, deployerAccount: LocalAccount, onComplete: () => void): Promise<TxReceipt> {
    const empireTurn = core.tables.Turn.get()?.empire;
    if (!empireTurn) throw new Error("Turn not found");

    const empirePlanets = core.utils.getEmpirePlanets(empireTurn);
    const routineThresholds = empirePlanets.map((planet) => core.utils.getRoutineThresholds(planet));

    return await execute({
      functionName: "Empires__updateWorld",
      // @ts-expect-error Wrong type
      args: [routineThresholds],
      options: {
        gas: 25000000n,
      },
      onComplete,
      core,
      playerAccount: deployerAccount,
    });
  }
}
