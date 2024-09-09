import { useCallback, useEffect, useMemo, useState } from "react";

import { worldsJson } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { createClient as createKeeperClient } from "@primodiumxyz/keeper";

const worlds = worldsJson as Partial<Record<keyof typeof worldsJson, { address: string; blockNumber?: number }>>;

export const useKeeperClient = (): {
  start: () => Promise<{ success: boolean }>;
  stop: () => Promise<{ success: boolean }>;
  getStatus: () => Promise<{ running: boolean }>;
  running: boolean;
} => {
  const { config, tables } = useCore();
  const [running, setRunning] = useState(false);

  const keeper = useMemo(() => {
    const keeperUrl = config.chain.keeperUrl;
    return keeperUrl ? createKeeperClient({ url: keeperUrl }) : undefined;
  }, [config.chain]);

  const { worldAddress, initialBlockNumber } = useMemo(() => {
    const chainId = config.chain.id.toString() as keyof typeof worlds;
    return { worldAddress: worlds[chainId]?.address, initialBlockNumber: worlds[chainId]?.blockNumber ?? 0 };
  }, [config.chain]);

  const startKeeper = useCallback(async () => {
    if (!keeper || !worldAddress) return { success: false };
    return await keeper.start.mutate({ worldAddress, initialBlockNumber: initialBlockNumber.toString() });
  }, [keeper, worldAddress, initialBlockNumber]);

  const stopKeeper = useCallback(async () => {
    if (!keeper) return { success: false };
    return await keeper.stop.mutate();
  }, [keeper]);

  const getKeeperStatus = useCallback(async () => {
    if (!keeper) return { running: false };
    return keeper.getStatus.query();
  }, [keeper]);

  useEffect(() => {
    if (!keeper) return;
    const unsubscribe = tables.Time.watch({
      onChange: async () => {
        const { running: isRunning } = await getKeeperStatus();
        setRunning(isRunning);
      },
    });

    return () => unsubscribe();
  }, [keeper, tables.Time, getKeeperStatus]);

  return { start: startKeeper, stop: stopKeeper, getStatus: getKeeperStatus, running };
};
