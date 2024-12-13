import { Hex } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { StorageAdapterLog } from "@primodiumxyz/reactive-tables/utils";
import { Read, Sync } from "@primodiumxyz/sync-stack";
import { Keys } from "@core/lib";
import { CoreConfig, CreateNetworkResult, SyncSourceType, SyncStep, Tables } from "@core/lib/types";
import { getActionLogQuery } from "@core/sync/queries/actionLogQueries";
import { getInitialQuery } from "@core/sync/queries/initialQueries";
import { bigintMax } from "@core/utils";

/**
 * Creates sync object. Includes methods to sync data from RPC and Indexer
 *
 * @param config core configuration {@link CoreConfig}
 * @param network network object created in {@link createNetwork} {@link CreateNetworkResult}
 * @param tables tables generated for core object
 * @returns {@link SyncType Sync}
 *
 * @remarks
 * Usual sync flow with indexer is as follows:
 * 1. Start live sync that will
 *   a. if we're syncing, record logs as they are coming in (because the indexer won't return them)
 *   b. if sync is over, just process them as they are coming in (actual live sync)
 * 2. Sync from indexer (from initial block to latest safe block)
 * 3. Sync blocks from the latest safe block (last block recorded by indexer) to the latest "unsafe" block (from app launch, when we started recording logs)
 * 4. Sync pending blocks (logs that came in during indexer & rpc sync)
 * 5. Continue live sync (won't store logs anymore, just process them as they are coming in)
 */
export function createSync(config: CoreConfig, network: CreateNetworkResult, tables: Tables) {
  const { tableDefs, world, publicClient, storageAdapter } = network;
  const indexerUrl = config.chain.indexerUrl;

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

  const subscribeToRPC = async (initialBlockNumber: bigint) => {
    const firstBlockNumberStoredLive = await publicClient.getBlockNumber();
    // Store logs that come in during indexer & rpc sync
    const pendingLogs: StorageAdapterLog[] = [];
    const storePendingLogs = (log: StorageAdapterLog) => pendingLogs.push(log);

    // Process logs right after sync and before switching to live
    const processLatestLogs = (lastBlockNumberIndexed?: bigint) => {
      const processPendingLogs = () => {
        pendingLogs.forEach((log, index) => {
          storageAdapter(log);
          const blockNumber = log.blockNumber ?? BigInt(0);
          const progress = index / pendingLogs.length;

          tables.SyncStatus.set({
            step: SyncStep.Syncing,
            message: "Processing logs that came in during sync",
            progress,
            lastBlockNumberProcessed: blockNumber,
          });
        });

        tables.SyncStatus.set({
          step: SyncStep.Live,
          progress: 1,
          message: "Subscribed to live updates",
          lastBlockNumberProcessed: tables.SyncStatus.get()?.lastBlockNumberProcessed ?? BigInt(0),
        });
      };

      // If the last block processed by the indexer/RPC is behind the block at which the sync started, we need to catch up
      // This will happen with the indexer as it's following safe blocks, so it will be missing the latest ones
      // So we need to sync from `lastBlockNumberIndexed` (last safe block indexed) to `blockNumber - 1` (last block before starting live sync and recording logs)
      const blockRange: [bigint, bigint] = [
        bigintMax(lastBlockNumberIndexed, initialBlockNumber)!, // in case of error it might return the first block of the chain, which we don't want
        (firstBlockNumberStoredLive ?? BigInt(1)) - BigInt(1),
      ];

      if (blockRange[1] > blockRange[0]) {
        syncFromRPC(
          blockRange[0],
          blockRange[1],
          // once done, we can process logs that came in after launch
          processPendingLogs,
          (err: unknown) => {
            console.error(err);
          },
        );
      } else {
        processPendingLogs();
      }
    };

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
    return processLatestLogs;
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
      }
    }, onError);

    world.registerDisposer(sync.unsubscribe);
  };

  const syncActionLogs = () => {
    // if we're already syncing from RPC, don't sync from indexer
    if (tables.SyncSource.get()?.value === SyncSourceType.RPC) return;

    if (!indexerUrl) return;

    const syncId = Keys.ACTION_LOG;
    const sync = Sync.withCustom({
      reader: Read.fromDecodedIndexer.query({
        indexerUrl,
        query: getActionLogQuery({
          tables: tableDefs,
          worldAddress: config.worldAddress as Hex,
        }),
      }),
      writer: storageAdapter,
    });

    sync.start(
      ...createSyncHandlers(syncId, {
        progress: "Syncing action logs...",
        complete: "Action logs synced",
        error: "Error syncing action logs",
      }),
    );

    world.registerDisposer(sync.unsubscribe);
  };

  return {
    syncFromRPC,
    subscribeToRPC,

    syncInitialGameState,
    syncActionLogs,
  };
}
