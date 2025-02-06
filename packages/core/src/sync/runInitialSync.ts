import { Core, SyncSourceType, SyncStep } from "@core/lib/types";

/**
 * Runs default initial sync process. Syncs to indexer. If indexer is not available, syncs to RPC.
 *
 * @param core {@link Core}
 * @param playerAddress Player address (optional). If included, will fetch player data on initial sync
 */
export const runInitialSync = async (core: Core) => {
  const {
    network,
    tables,
    config,
    sync: { syncFromRPC, subscribeToRPC, syncInitialGameState },
  } = core;
  const { publicClient } = network;
  const fromBlock = config.initialBlockNumber ?? 0n;

  if (!config.chain.indexerUrl) {
    console.warn("No indexer url found, hydrating from RPC");
    tables.SyncSource.set({ value: SyncSourceType.RPC });

    const toBlock = await publicClient.getBlockNumber();

    // Start live sync right away (it will store logs until `SyncStatus` is `SyncStep.Live`)
    const processLatestLogs = await subscribeToRPC(fromBlock);

    syncFromRPC(
      fromBlock,
      toBlock,
      //on complete
      (blockNumber: bigint) => processLatestLogs(blockNumber),
      //on error
      (err: unknown) => {
        tables.SyncStatus.set({
          step: SyncStep.Error,
          progress: 0,
          message: `Failed to sync from RPC`,
          lastBlockNumberProcessed: tables.SyncStatus.get()?.lastBlockNumberProcessed ?? BigInt(0),
        });

        console.warn("Failed to sync from RPC");
        console.log(err);
      },
    );

    return;
  }

  const onError = async (err: unknown) => {
    console.warn("Failed to fetch from indexer, hydrating from RPC", err);
    const toBlock = await publicClient.getBlockNumber();
    const processLatestLogs = await subscribeToRPC(fromBlock);

    syncFromRPC(
      fromBlock,
      toBlock,
      //on complete
      (blockNumber: bigint) => processLatestLogs(blockNumber),
      //on error
      (err: unknown) => {
        tables.SyncStatus.set({
          step: SyncStep.Error,
          progress: 0,
          message: `Failed to sync from RPC. Please try again.`,
          lastBlockNumberProcessed: tables.SyncStatus.get()?.lastBlockNumberProcessed ?? BigInt(0),
        });
        console.warn("Failed to sync from RPC ", err);
      },
    );
  };

  tables.SyncSource.set({ value: SyncSourceType.Indexer });
  const processLatestLogs = await subscribeToRPC(fromBlock);

  // sync initial game state from indexer
  syncInitialGameState(
    // on complete
    (blockNumber: bigint) => {
      tables.SyncStatus.set({
        step: SyncStep.Complete,
        progress: 1,
        message: `DONE`,
        lastBlockNumberProcessed: blockNumber,
      });

      processLatestLogs(blockNumber);
    },
    onError,
  );

  // resolve when sync is live
  return await new Promise<void>((resolve) => {
    tables.SyncStatus.watch({
      onChange: ({ properties }) => {
        if (properties.current?.step === SyncStep.Live) {
          resolve();
        }
      },
    });
  });
};
