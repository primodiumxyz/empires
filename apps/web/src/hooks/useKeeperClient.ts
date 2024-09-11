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
    const bearerToken = import.meta.env.KEEPER_BEARER_TOKEN;
    return keeperUrl ? createKeeperClient({ url: keeperUrl, token: bearerToken }) : undefined;
  }, [config.chain]);

  const { chainId, worldAddress, initialBlockNumber } = useMemo(() => {
    const chainId = config.chain.id.toString() as keyof typeof worlds;
    return { chainId, worldAddress: worlds[chainId]?.address, initialBlockNumber: worlds[chainId]?.blockNumber ?? 0 };
  }, [config.chain]);

  const startKeeper = useCallback(async () => {
    if (!keeper || !chainId || !worldAddress) return { success: false };
    return await keeper.start.mutate({ chainId, worldAddress, initialBlockNumber: initialBlockNumber.toString() });
  }, [keeper, chainId, worldAddress, initialBlockNumber]);

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
    const interval = setInterval(async () => {
      const { running: isRunning } = await getKeeperStatus();
      setRunning(isRunning);
    }, 3000);

    return () => clearInterval(interval);
  }, [keeper, tables.Time, getKeeperStatus]);

  return { start: startKeeper, stop: stopKeeper, getStatus: getKeeperStatus, running };
};
