import { useEffect, useMemo, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";

export const useTimeLeft = (): {
  timeLeftMs: number | undefined;
  blocksLeft: bigint;
  timeUntilStartMs: number | undefined;
  started: boolean;
} => {
  const { tables } = useCore();
  const [timeLeft, setTimeLeft] = useState<number>();
  const [timeUntilStart, setTimeUntilStart] = useState<number>();
  const gameConfig = tables.P_GameConfig.use();
  const endBlock = gameConfig?.gameOverBlock ?? 0n;
  const startBlock = gameConfig?.gameStartBlock ?? 0n;

  const block = tables.BlockNumber.use();
  const time = tables.Time.use();

  const expectedEndTime = useMemo(() => {
    if (!block) return 0;
    const blocksLeft = endBlock - block.value;
    const timeLeft = Number(blocksLeft) * block.avgBlockTime;
    return Date.now() + timeLeft * 1000;
  }, [block, endBlock]);

  const getEndTime = () => {
    if (!expectedEndTime) return;
    setTimeLeft(expectedEndTime - Date.now());
  };

  const expectedStartTime = useMemo(() => {
    if (!block) return;
    const blocksLeft = startBlock > block.value ? startBlock - block.value : 0n;
    const timeLeft = Number(blocksLeft) * block.avgBlockTime;
    return Date.now() + timeLeft * 1000;
  }, [block, startBlock]);

  const getStartTime = () => {
    if (!expectedStartTime) return;
    setTimeUntilStart(expectedStartTime - Date.now());
  };

  useEffect(() => {
    getEndTime();
    getStartTime();
    const interval = setInterval(() => {
      getEndTime();
      getStartTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [expectedEndTime, expectedStartTime]);

  return useMemo(() => {
    if (!block) return { timeLeftMs: 0, blocksLeft: 0n, timeUntilStartMs: 0, started: false };
    const blocksLeft = endBlock - block.value;
    const started = block.value >= startBlock;
    return { timeLeftMs: timeLeft, blocksLeft, timeUntilStartMs: timeUntilStart, started };
  }, [time, block, endBlock, timeLeft, timeUntilStart]);
};
