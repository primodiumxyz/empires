import { useMemo } from "react";

import { useCore } from "@primodiumxyz/core/react";

export const useTimeLeft = (): { gameOver: boolean; timeLeft: number; blocksLeft: bigint } => {
  const { tables } = useCore();
  const endBlock = tables.P_GameConfig.use()?.gameOverBlock ?? 0n;

  const block = tables.BlockNumber.use();

  return useMemo(() => {
    if (!block) return { gameOver: false, timeLeft: 0, blocksLeft: 0n };
    const blocksLeft = endBlock - block.value;
    const gameOver = blocksLeft <= 0n;
    const timeLeft = Number(blocksLeft) * block.avgBlockTime;
    return { gameOver, timeLeft, blocksLeft };
  }, [block, endBlock]);
};
