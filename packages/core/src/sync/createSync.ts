import { Hex } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { StorageAdapterLog } from "@primodiumxyz/reactive-tables/utils";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { Keys } from "@core/lib";
import { CoreConfig, CreateNetworkResult, SyncSourceType, SyncStep, Tables } from "@core/lib/types";
import { getSecondaryQuery } from "@core/sync/queries/secondaryQueries";

import { getInitialQuery } from "./queries/initialQueries";

/**
 * Creates sync object. Includes methods to sync data from RPC and Indexer
 *
 * @param config core configuration {@link CoreConfig}
 * @param network network object created in {@link createNetwork} {@link CreateNetworkResult}
 * @param tables tables generated for core object
 * @returns {@link SyncType Sync}
 */
export function createSync(config: CoreConfig, network: CreateNetworkResult, tables: Tables) {
  const { tableDefs, world, publicClient, storageAdapter } = network;
  const indexerUrl = config.chain.indexerUrl;
  let fromBlock = config.initialBlockNumber ?? 0n;

  const syncFromRPC = (
    fromBlock: bigint,
    toBlock: bigint,
    onComplete?: (blockNumber: bigint) => void,
    onError?: (err: unknown) => void,
    syncId?: Entity,
  ) => {
    const sync = Sync.withCustom({
      reader: Read.fromRPC.filter({
        address: config.worldAddress as Hex,
        publicClient,
        fromBlock,
        toBlock,
      }),
      writer: storageAdapter,
    });

    sync.start((_, blockNumber, progress) => {
      tables.SyncStatus.set(
        {
          step: SyncStep.Syncing,
          progress,
          message: `Syncing from RPC...`,
          lastBlockNumberProcessed: blockNumber,
        },
        syncId,
      );

      if (progress === 1) {
        tables.SyncStatus.set(
          {
            step: SyncStep.Complete,
            progress: 1,
            message: `LIVE`,
            lastBlockNumberProcessed: blockNumber,
          },
          syncId,
        );

        onComplete?.(blockNumber);
      }
    }, onError);

    world.registerDisposer(sync.unsubscribe);
  };

  const subscribeToRPC = () => {
    // Store logs that come in during indexer & rpc sync
    const pendingLogs: StorageAdapterLog[] = [];
    const storePendingLogs = (log: StorageAdapterLog) => pendingLogs.push(log);
    // Process logs right after sync and before switching to live
    const processPendingLogs = () =>
      pendingLogs.forEach((log, index) => {
        storageAdapter(log);
        const blockNumber = log.blockNumber ?? tables.SyncStatus.get()?.lastBlockNumberProcessed ?? BigInt(0);
        const progress = index / pendingLogs.length;

        tables.SyncStatus.set({
          step: SyncStep.Syncing,
          message: "Processing pending logs",
          progress,
          lastBlockNumberProcessed: blockNumber,
        });
      });

    const sync = Sync.withCustom({
      reader: Read.fromRPC.subscribe({
        address: config.worldAddress as Hex,
        publicClient,
      }),
      writer: (logs) =>
        tables.SyncStatus.get()?.step === SyncStep.Live ? storageAdapter(logs) : storePendingLogs(logs),
    });

    sync.start((_, blockNumber) => {
      console.log("syncing updates on block:", blockNumber);
      tables.SyncStatus.set({
        step: SyncStep.Live,
        progress: 1,
        message: "Live",
        lastBlockNumberProcessed: blockNumber,
      });
    });

    world.registerDisposer(sync.unsubscribe);
    return processPendingLogs;
  };

  function createSyncHandlers(
    syncId: Entity,
    message: {
      progress: string;
      complete: string;
      error: string;
    },
  ) {
    return [
      (_: number, blockNumber: bigint, progress: number) => {
        tables.SyncStatus.set(
          {
            step: SyncStep.Syncing,
            progress,
            message: message.progress,
            lastBlockNumberProcessed: blockNumber,
          },
          syncId,
        );

        if (progress === 1) {
          tables.SyncStatus.set(
            {
              step: SyncStep.Complete,
              progress: 1,
              message: message.complete,
              lastBlockNumberProcessed: blockNumber,
            },
            syncId,
          );
        }
      },
      // on error
      (e: unknown) => {
        console.error(e);
        tables.SyncStatus.set(
          {
            step: SyncStep.Error,
            progress: 0,
            message: message.error,
            lastBlockNumberProcessed: tables.SyncStatus.get()?.lastBlockNumberProcessed ?? BigInt(0),
          },
          syncId,
        );
      },
    ];
  }

  const syncInitialGameState = (onComplete: (blockNumber: bigint) => void, onError: (err: unknown) => void) => {
    // if we're already syncing from RPC, don't sync from indexer
    if (tables.SyncSource.get()?.value === SyncSourceType.RPC) return;

    if (!indexerUrl) return;

    const sync = Sync.withCustom({
      reader: Read.fromDecodedIndexer.query({
        indexerUrl,
        query: getInitialQuery({
          tables: tableDefs,
          worldAddress: config.worldAddress as Hex,
        }),
      }),
      writer: storageAdapter,
    });

    sync.start(async (_, blockNumber, progress) => {
      tables.SyncStatus.set({
        step: SyncStep.Syncing,
        progress,
        message: `Syncing...`,
        lastBlockNumberProcessed: blockNumber,
      });

      if (progress === 1) {
        onComplete(blockNumber);
        fromBlock = blockNumber;
      }
    }, onError);

    world.registerDisposer(sync.unsubscribe);
  };

  const syncSecondaryGameState = (onComplete: () => void, onError: (err: unknown) => void) => {
    // if we're already syncing from RPC, don't sync from indexer
    if (tables.SyncSource.get()?.value === SyncSourceType.RPC) return;

    if (!indexerUrl) return;

    const syncId = Keys.SECONDARY;
    const sync = Sync.withCustom({
      reader: Read.fromDecodedIndexer.query({
        indexerUrl,
        query: getSecondaryQuery({
          tables: tableDefs,
          worldAddress: config.worldAddress as Hex,
        }),
      }),
      writer: storageAdapter,
    });

    sync.start(async (_, blockNumber, progress) => {
      tables.SyncStatus.set(
        {
          step: SyncStep.Syncing,
          progress,
          message: `Syncing...`,
          lastBlockNumberProcessed: blockNumber,
        },
        syncId,
      );

      // sync remaining blocks from RPC
      if (progress === 1) {
        const latestBlockNumber = await publicClient.getBlockNumber();
        const processPendingLogs = subscribeToRPC();
        syncFromRPC(
          fromBlock,
          latestBlockNumber,
          () => {
            processPendingLogs();
            onComplete();
          },
          () => {
            console.warn("Failed to sync remaining blocks. Client may be out of sync!");
          },
          syncId,
        );
      }
    }, onError);

    world.registerDisposer(sync.unsubscribe);
  };

  return {
    syncFromRPC,
    subscribeToRPC,

    syncInitialGameState,
    syncSecondaryGameState,
  };
}
