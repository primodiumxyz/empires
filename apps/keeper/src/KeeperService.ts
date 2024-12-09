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

    enum KeeperState {
      NotReady = 1,
      WaitingToStart,
      GameRunning,
      DistributingFunds,
      ResettingGame,
    }

    let keeperState = KeeperState.NotReady;
    let keeperStateString = "Not Ready";
    let TxMutex = false;
    let resetting = false;

    this.unsubscribe = core.tables.BlockNumber.watch({
      onChange: async ({ properties: { current } }) => {
        const ready = core.tables.Ready.get()?.value ?? false;
        const startBlock = core.tables.P_GameConfig.get()?.gameStartBlock ?? 0n;
        const endBlock = core.tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
        const blocksLeft = endBlock - (current?.value ?? 0n) - 1n;
        const gameOver = blocksLeft <= 0n;
        const startNextRound = (current?.value ?? 0n) + 120n;


        console.info(`STATUS[${current?.value ?? 0n}]: ${keeperStateString}`);
        const txQueueSize = core.tables.TransactionQueue.getSize();
        if (txQueueSize > 0 || TxMutex) {
          // console.info("SKIPPING: transaction in progress");
          return;
        }

        switch (keeperState) {

          case KeeperState.NotReady:
            if (ready) {
              keeperState = KeeperState.WaitingToStart;
              keeperStateString = "Waiting To Start";
            }
            break;

          case KeeperState.WaitingToStart:
            if (ready && (current?.value ?? 0n) >= startBlock) {
              console.info("\n*** Game starting\n");
              keeperState = KeeperState.GameRunning;
              keeperStateString = "Game Running";
            }
            break;

          case KeeperState.GameRunning:
            if (gameOver) {
              console.info("\n*** Game ending\n");
              // TODO: reset loop test.  remove, and go back to distro state routing
              keeperState = KeeperState.ResettingGame;
              keeperStateString = "Resetting Game";
              // keeperState = KeeperState.DistributingFunds;
              // keeperStateString = "Distributing Funds";
              return;
            }

            const nextTurnBlock = core.tables.Turn.get()?.nextTurnBlock ?? 0n;
            if ((current?.value ?? 0n) < nextTurnBlock) {
              // console.info(`SKIPPING: current block ${current?.value} next turn block ${nextTurnBlock}`);
              return;
            }

            TxMutex = true;
            await this.updateWorld(core, deployerAccount, () => {
              TxMutex = false;
            });
            break;

          case KeeperState.DistributingFunds:
            console.info("\n** Distributing funds\n");
            TxMutex = true;
            await this.distributeFunds(core, deployerAccount, () => {
              console.info("\n** Funds distributed\n");
              keeperState = KeeperState.ResettingGame;
              keeperStateString = "Resetting Game";
              TxMutex = false;
            });
            break;

          case KeeperState.ResettingGame:
            // resetGame needs to be called once for each Empire.
            // the ready flag is set to false on the first call,
            // and set to true when the reset is completed.
            if (!resetting) {
              // log the start the process
              console.info("\n** Resetting game\n");
              resetting = true;
            }
            else {
              // if we're done, change state and exit.s
              if ((core.tables.Ready.get()?.value ?? false) == true) {
                keeperState = KeeperState.WaitingToStart;
                keeperStateString = "Waiting To Start";
                resetting = false;
                return;
              }
            }

            // execute a reset step
            TxMutex = true;
            await this.setupNextRound(core, deployerAccount, startNextRound, () => {
              TxMutex = false;
            });
            break;
        }
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
          if (current?.step === SyncStep.Live) {
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

  private async distributeFunds(core: Core, deployerAccount: LocalAccount, onComplete: () => void): Promise<TxReceipt> {
    return await execute({
      functionName: "Empires__distributeFunds",
      args: [],
      options: {
        gas: 25000000n,
      },
      onComplete,
      core,
      playerAccount: deployerAccount,
    });
  }

  private async setupNextRound(core: Core, deployerAccount: LocalAccount, nextStartBlock: bigint, onComplete: () => void): Promise<TxReceipt> {
    return await execute({
      functionName: "Empires__resetGame",
      // @ts-expect-error Wrong type
      args: [nextStartBlock],
      options: {
        gas: 25000000n,
      },
      onComplete,
      core,
      playerAccount: deployerAccount,
    });
  }
}
