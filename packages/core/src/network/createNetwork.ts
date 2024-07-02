import { transportObserver } from '@latticexyz/common';
import mudConfig from 'contracts/mud.config';
import { Hex, createPublicClient, fallback, http } from 'viem';
import { setupRecs } from '@/recs/setupRecs';
import { createWorld } from '@primodiumxyz/reactive-tables';
import { createClock } from '@/network/createClock';
import { otherTableDefs } from '@/network/otherTableDefs';
import { CoreConfig, CreateNetworkResult } from '@/lib/types';
import { setupSyncTables } from '@/tables/syncTables';

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
  const {
    tables,
    tableDefs,
    storageAdapter,
    latestBlock$,
    latestBlockNumber$,
    storedBlockLogs$,
    waitForTransaction,
  } = setupRecs({
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
