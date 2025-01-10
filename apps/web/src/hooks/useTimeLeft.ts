import { useEffect, useMemo, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import useWinningEmpire from "@/hooks/useWinningEmpire";

export const useTimeLeft = (): {
  timeLeftMs: number | undefined;
  blocksLeft: bigint;
  timeUntilStartMs: number | undefined;
  started: boolean;
  gameActive: boolean;
} => {
  const { tables } = useCore();
  const { gameOver } = useWinningEmpire();
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
    if (!block) return { timeLeftMs: 0, blocksLeft: 0n, timeUntilStartMs: 0, started: false, gameActive: false };
    const blocksLeft = endBlock - block.value;
    const started = block.value >= startBlock;
    return {
      timeLeftMs: timeLeft,
      blocksLeft,
      timeUntilStartMs: timeUntilStart,
      started,
      gameActive: started && !gameOver,
    };
  }, [time, block, endBlock, timeLeft, timeUntilStart, gameOver]);
};
