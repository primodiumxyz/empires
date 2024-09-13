import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { worldsJson } from "@primodiumxyz/contracts";
import { storage } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { createClient as createKeeperClient } from "@primodiumxyz/keeper";

const worlds = worldsJson as Partial<Record<keyof typeof worldsJson, { address: string; blockNumber?: number }>>;

export const useKeeperClient = (): {
  instance: ReturnType<typeof createKeeperClient> | undefined;
  running: boolean;
  create: () => void;
  start: () => Promise<{ success: boolean }>;
  stop: () => Promise<{ success: boolean }>;
  getStatus: () => Promise<{ running: boolean }>;
  setBearerToken: (token: string) => void;
} => {
  const { config, tables } = useCore();
  const [running, setRunning] = useState(false);
  const keeper = useRef<ReturnType<typeof createKeeperClient> | undefined>();

  const { chainId, worldAddress, initialBlockNumber } = useMemo(() => {
    const chainId = config.chain.id.toString() as keyof typeof worlds;
    return { chainId, worldAddress: worlds[chainId]?.address, initialBlockNumber: worlds[chainId]?.blockNumber ?? 0 };
  }, [config.chain]);

  const createKeeper = useCallback(() => {
    const keeperUrl = config.chain.keeperUrl;
    const bearerToken = storage.getItem("keeperBearerToken");
    if (keeperUrl && bearerToken) keeper.current = createKeeperClient({ url: keeperUrl, token: bearerToken });
  }, [config.chain]);

  const startKeeper = useCallback(async () => {
    if (!keeper.current || !chainId || !worldAddress) return { success: false };

    const res = await keeper.current.start.mutate({
      chainId,
      worldAddress,
      initialBlockNumber: initialBlockNumber.toString(),
    });

    if (res.success) setRunning(true);
    return res;
  }, [keeper, chainId, worldAddress, initialBlockNumber]);

  const stopKeeper = useCallback(async () => {
    if (!keeper.current) return { success: false };

    const res = await keeper.current.stop.mutate();
    if (res.success) setRunning(false);
    return res;
  }, [keeper]);

  const getKeeperStatus = useCallback(async () => {
    if (!keeper.current) return { running: false };
    return keeper.current.getStatus.query();
  }, [keeper]);

  useEffect(() => {
    createKeeper();
  }, [config.chain]);

  useEffect(() => {
    if (!keeper) return;
    const interval = setInterval(async () => {
      const { running: isRunning } = await getKeeperStatus();
      setRunning(isRunning);
    }, 3000);

    return () => clearInterval(interval);
  }, [keeper, tables.Time, getKeeperStatus]);

  return {
    instance: keeper.current,
    running,
    create: createKeeper,
    start: startKeeper,
    stop: stopKeeper,
    getStatus: getKeeperStatus,
    setBearerToken: (token: string) => storage.setItem("keeperBearerToken", token),
  };
};
