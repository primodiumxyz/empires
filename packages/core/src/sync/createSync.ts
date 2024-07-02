import { Hex } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { StorageAdapterLog } from "@primodiumxyz/reactive-tables/utils";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { Keys } from "@/lib";
import { CoreConfig, CreateNetworkResult, SyncSourceType, SyncStep, Tables } from "@/lib/types";
import { getSecondaryQuery } from "@/sync/queries/secondaryQueries";

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
    onComplete?: () => void,
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

    sync.start((_, __, progress) => {
      tables.SyncStatus.set(
        {
          step: SyncStep.Syncing,
          progress,
          message: `Hydrating from RPC`,
        },
        syncId,
      );

      if (progress === 1) {
        tables.SyncStatus.set(
          {
            step: SyncStep.Complete,
            progress: 1,
            message: `DONE`,
          },
          syncId,
        );

        onComplete?.();
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
        tables.SyncStatus.update({
          message: "Processing pending logs",
          progress: index / pendingLogs.length,
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
      (_: number, ___: bigint, progress: number) => {
        tables.SyncStatus.set(
          {
            step: SyncStep.Syncing,
            progress,
            message: message.progress,
          },
          syncId,
        );

        if (progress === 1) {
          tables.SyncStatus.set(
            {
              step: SyncStep.Complete,
              progress,
              message: message.complete,
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
          },
          syncId,
        );
      },
    ];
  }

  const syncInitialGameState = (onComplete: () => void, onError: (err: unknown) => void) => {
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
        message: `Hydrating from Indexer`,
      });

      if (progress === 1) {
        onComplete();
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

    sync.start(async (_, __, progress) => {
      tables.SyncStatus.set(
        {
          step: SyncStep.Syncing,
          progress,
          message: `Hydrating from Indexer`,
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
