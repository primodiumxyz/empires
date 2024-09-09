import { useCallback, useEffect, useMemo, useState } from "react";
import { transportObserver } from "@latticexyz/common";
import { createWalletClient, fallback, formatEther, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { worldsJson } from "@primodiumxyz/contracts";
import { minEth, TxReceipt } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { createClient as createKeeperClient } from "@primodiumxyz/keeper";
import { Entity } from "@primodiumxyz/reactive-tables";

export const CHAIN = import.meta.env.PRI_CHAIN_ID;
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
    const chainId = CHAIN as keyof typeof worlds;
    return { worldAddress: worlds[chainId]?.address, initialBlockNumber: worlds[chainId]?.blockNumber };
  }, [config.chain]);

  const startKeeper = useCallback(async () => {
    if (!keeper || !worldAddress || !initialBlockNumber) return { success: false };
    return await keeper.start.mutate({ worldAddress, initialBlockNumber: initialBlockNumber.toString() });
  }, [keeper, worldAddress, initialBlockNumber]);

  const stopKeeper = useCallback(async () => {
    if (!keeper) return { success: false };
    return await keeper.stop.mutate();
  }, [keeper]);

  const getKeeperStatus = useCallback(async () => {
    if (!keeper) return { running: false };
    return await keeper.getStatus.query();
  }, [keeper]);

  useEffect(() => {
    const unsubscribe = tables.Time.watch({
      onChange: async () => {
        const { running: isRunning } = await getKeeperStatus();
        setRunning(isRunning);
      },
    });

    return () => unsubscribe();
  }, [tables.Time, getKeeperStatus]);

  return { start: startKeeper, stop: stopKeeper, getStatus: getKeeperStatus, running };
};
