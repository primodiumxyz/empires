import { createBlockStream } from "@latticexyz/block-logs-stream";
import { map, Observable, share, shareReplay } from "rxjs";
import { Block, Hex, PublicClient } from "viem";

import {
  ContractTableDefs,
  createWrapper,
  World as RecsWorld,
  StoreConfig,
  WrapperResult,
} from "@primodiumxyz/reactive-tables";
import { StorageAdapterBlock } from "@primodiumxyz/reactive-tables/utils";
import { Read } from "@primodiumxyz/sync-stack";
import { SyncStep } from "@core/lib";
import { SyncTables } from "@core/tables/syncTables";

export type Recs<config extends StoreConfig, extraTables extends ContractTableDefs> = Omit<
  WrapperResult<config, extraTables>,
  "world" | "triggerUpdateStream"
> & {
  latestBlock$: Observable<Block<bigint, false, "latest">>;
  latestBlockNumber$: Observable<bigint>;
  storedBlockLogs$: Observable<StorageAdapterBlock>;
};

//TODO: Move this into the reactive-tables package
export const setupRecs = <config extends StoreConfig, extraTables extends ContractTableDefs>(args: {
  mudConfig: config;
  world: RecsWorld;
  publicClient: PublicClient;
  address: Hex;
  otherTableDefs?: extraTables;
  syncTables?: SyncTables;
  devTools?: boolean;
}): Recs<config, extraTables> => {
  const { mudConfig, publicClient, world, address, otherTableDefs, syncTables, devTools } = args;

  const { tables, tableDefs, storageAdapter } = createWrapper({
    mudConfig,
    world,
    otherTableDefs,
    shouldSkipUpdateStream: () => syncTables?.SyncStatus.get()?.step !== SyncStep.Live,
    devTools: {
      enabled: devTools,
      publicClient,
      worldAddress: address,
    },
  });

  const latestBlock$ = createBlockStream({
    publicClient,
    blockTag: "latest",
  }).pipe(shareReplay(1));

  const latestBlockNumber$ = latestBlock$.pipe(
    map((block) => block.number),
    shareReplay(1),
  );

  const storedBlockLogs$ = new Observable<StorageAdapterBlock>((subscriber) => {
    const unsub = Read.fromRPC
      .subscribe({
        address,
        publicClient,
      })
      .subscribe((block) => {
        subscriber.next({
          blockNumber: block.blockNumber,
          logs: [...block.logs],
        });
      });

    // Handle unsubscription
    return () => {
      unsub();
    };
  }).pipe(share());

  return {
    tables,
    tableDefs,
    storageAdapter,
    latestBlock$,
    latestBlockNumber$,
    storedBlockLogs$,
  };
};
