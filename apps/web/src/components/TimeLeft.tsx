import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatTime } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Tooltip } from "@/components/core/Tooltip";
import { useSettings } from "@/hooks/useSettings";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import useWinningEmpire from "@/hooks/useWinningEmpire";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const TimeLeft = ({ className }: { className?: string }) => {
  const { timeLeftMs, blocksLeft } = useTimeLeft();
  const { gameOver } = useWinningEmpire();
  const { showBlockchainUnits } = useSettings();
  const { tables } = useCore();

  const endTime = useMemo(() => {
    return new Date(Date.now() + (timeLeftMs ?? 0));
  }, [timeLeftMs]);
  const turn = tables.Turn.use();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  const avgBlockTime = tables.BlockNumber.use()?.avgBlockTime ?? 0;

  const timeLeft = formatTime(
    Math.max(0, Number(turn?.nextTurnBlock ?? 0n) - Number(blockNumber)) * Number(avgBlockTime),
  );
  if (!turn || gameOver) return null;

  return (
    <div className={cn("flex flex-col justify-center gap-1 text-center", className)}>
      <Tooltip tooltipContent={endTime.toLocaleString()} direction="top">
        <p className="text-sm opacity-90">
          Round ends in <span className="text-accent">{formatTime((timeLeftMs ?? 0) / 1000)}</span>
        </p>
        <p className="text-xs font-bold opacity-80">
          {EmpireEnumToConfig[turn.empire as EEmpire].name}'s Turn in <span className="text-secondary">{timeLeft}</span>
        </p>
      </Tooltip>
      {showBlockchainUnits.enabled && !!blocksLeft && (
        <span className="text-xs">({blocksLeft.toLocaleString()} blocks)</span>
      )}
    </div>
  );
};
