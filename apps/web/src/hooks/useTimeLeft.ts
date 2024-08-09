import { useEffect, useMemo, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";

export const useTimeLeft = (): { timeLeftMs: number | undefined; blocksLeft: bigint } => {
  const { tables } = useCore();
  const [timeLeft, setTimeLeft] = useState<number>();
  const endBlock = tables.P_GameConfig.use()?.gameOverBlock ?? 0n;

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

  useEffect(() => {
    getEndTime();
    const interval = setInterval(() => {
      getEndTime();
    }, 1000);
    return () => clearInterval(interval);
  }, [expectedEndTime]);

  return useMemo(() => {
    if (!block) return { timeLeftMs: 0, blocksLeft: 0n };
    const blocksLeft = endBlock - block.value;
    return { timeLeftMs: timeLeft, blocksLeft };
  }, [time, block, endBlock, timeLeft]);
};
