import { transportObserver } from "@latticexyz/common";
import { createPublicClient, fallback, Hex, http } from "viem";

import { mudConfig } from "@primodiumxyz/contracts";
import { createWorld } from "@primodiumxyz/reactive-tables";
import { CoreConfig, CreateNetworkResult } from "@core/lib/types";
import { createClock } from "@core/network/createClock";
import { otherTableDefs } from "@core/network/otherTableDefs";
import { setupRecs } from "@core/recs/setupRecs";
import { setupSyncTables } from "@core/tables/syncTables";

/**
 * Creates network object
 *
 * @param config configuration of core object {@link CoreConfig}
 * @returns: {@link CreateNetworkResult}
 */
export function createNetwork(config: CoreConfig): CreateNetworkResult {
  const world = createWorld();

  const clientOptions = {
    chain: config.chain,
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  };

  const publicClient = createPublicClient(clientOptions);

  const syncTables = setupSyncTables(world);
  const { tables, tableDefs, storageAdapter, latestBlock$, latestBlockNumber$, storedBlockLogs$, waitForTransaction } =
    setupRecs({
      mudConfig,
      world,
      publicClient,
      address: config.worldAddress as Hex,
      otherTableDefs,
      syncTables,
      devTools: config.devTools,
    });

  const clock = createClock(world, latestBlock$, {
    period: 1100,
    initialTime: 0,
    syncInterval: 10000,
  });

  return {
    world,
    tables: { ...tables, ...syncTables },
    tableDefs,
    storageAdapter,
    publicClient,
    mudConfig,
    clock,
    latestBlock$,
    latestBlockNumber$,
    storedBlockLogs$,
    waitForTransaction,
  };
}
