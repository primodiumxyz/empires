import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatTime } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Tooltip } from "@/components/core/Tooltip";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import useWinningEmpire from "@/hooks/useWinningEmpire";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const TimeLeft = ({ className, small, invert }: { className?: string; small?: boolean; invert?: boolean }) => {
  const { started, timeUntilStartMs, timeLeftMs } = useTimeLeft();
  const { gameOver } = useWinningEmpire();
  const { tables } = useCore();

  const endTime = useMemo(() => {
    return new Date(Date.now() + (timeLeftMs ?? 0));
  }, [timeLeftMs]);
  const startTime = useMemo(() => {
    return new Date(Date.now() + (timeUntilStartMs ?? 0));
  }, [timeUntilStartMs]);
  const turn = tables.Turn.use();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  const avgBlockTime = tables.BlockNumber.use()?.avgBlockTime ?? 0;

  const timeLeft = formatTime(
    Math.max(0, Number(turn?.nextTurnBlock ?? 0n) - Number(blockNumber)) * Number(avgBlockTime),
  );

  if (!turn || (gameOver && !started && !timeUntilStartMs)) return null;
  if (!started && timeUntilStartMs) {
    return (
      <div className={cn("pointer-events-auto flex flex-col justify-center text-center lg:gap-1", className)}>
        <Tooltip tooltipContent={startTime.toLocaleString()} direction="top">
          <p className="text-xs font-bold opacity-80">
            Round starts in <span className="text-secondary">{formatTime((timeUntilStartMs ?? 0) / 1000)}</span>
          </p>
        </Tooltip>
      </div>
    );
  }
  return (
    <div className={cn("pointer-events-auto flex flex-col justify-center text-center lg:gap-1", className)}>
      {!invert && (
        <Tooltip tooltipContent={endTime.toLocaleString()} direction="top">
          <p className={cn("opacity-90", small ? "text-xs" : "text-sm")}>
            Round ends in <span className="text-accent">{formatTime((timeLeftMs ?? 0) / 1000)}</span>
          </p>
        </Tooltip>
      )}
      <p className="text-xs font-bold opacity-80">
        {EmpireEnumToConfig[turn.empire as EEmpire].name}'s Turn in <span className="text-secondary">{timeLeft}</span>
      </p>
      {invert && (
        <Tooltip tooltipContent={endTime.toLocaleString()} direction="top">
          <p className={cn("opacity-90", small ? "text-xs" : "text-sm")}>
            Round ends in <span className="text-accent">{formatTime((timeLeftMs ?? 0) / 1000)}</span>
          </p>
        </Tooltip>
      )}
    </div>
  );
};
