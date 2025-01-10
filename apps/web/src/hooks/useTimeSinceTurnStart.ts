import { useEffect, useMemo, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";

export const useTimeSinceTurnStart = () => {
  const { tables } = useCore();
  const turnLengthBlocks = tables.P_GameConfig.use()?.turnLengthBlocks ?? 1n;
  const turn = tables.Turn.use() ?? { value: 1n, nextTurnBlock: 1n };
  const blockNumber = tables.BlockNumber.use() ?? { value: 0n, avgBlockTime: 1 };

  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const baseTimeElapsed = useMemo(
    () => Number(blockNumber.value - (turn.nextTurnBlock - turnLengthBlocks)) * blockNumber.avgBlockTime,
    [blockNumber, turnLengthBlocks, turn.nextTurnBlock],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSecondsElapsed(0);
  }, [baseTimeElapsed]);

  const timeElapsed = baseTimeElapsed + secondsElapsed;

  return timeElapsed;
};
