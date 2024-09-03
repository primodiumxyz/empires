import { useMemo } from "react";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { EmpireLogo } from "@/components/shared/EmpireLogo";
import { Price } from "@/components/shared/Price";
import { useEmpires } from "@/hooks/useEmpires";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

export const Portfolio = ({ playerId }: { playerId: Entity }) => {
  const empires = useEmpires();

  const sortedEmpires = useMemo(
    () =>
      [...empires.keys()].sort((a, b) => {
        const aPoints = empires.get(a)?.empirePoints ?? 0n;
        const bPoints = empires.get(b)?.empirePoints ?? 0n;
        return Number(bPoints - aPoints);
      }),
    [empires],
  );

  const noPlanets = sortedEmpires.every((empire) => empires.get(empire)?.playerPoints === 0n);
  return (
    <div className="min-w-42 flex flex-col gap-2 text-right text-xs">
      {noPlanets && <p className="text-center text-xs opacity-70">You own no empires</p>}
      <div className="flex max-h-[70vh] flex-col overflow-y-auto">
        {sortedEmpires.map((empire, index) => (
          <EmpirePoints key={index} empire={empire} playerId={playerId} />
        ))}
      </div>
    </div>
  );
};

const EmpirePoints = ({ empire, playerId }: { empire: EEmpire; playerId: Entity }) => {
  const { tables } = useCore();

  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId })?.value ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pctTimes10000 = empirePoints > 0 ? (playerPoints * 10000n) / empirePoints : 0n;
  const pct = Number(pctTimes10000) / 100;

  const { price: pointCostWei } = usePointPrice(empire, Number(formatEther(playerPoints)));
  if (playerPoints === 0n) {
    return null;
  }

  return (
    <div className={cn("flex h-9 w-full items-center justify-between gap-5 border-none py-1 lg:h-14")}>
      <EmpireLogo empireId={empire} size="xs" />
      <div className="pointer-events-auto flex flex-col justify-end text-right">
        <p className="text-base">{formatEther(playerPoints)} pts</p>
        <div className="hidden lg:block">
          <Price wei={pointCostWei} />
          {pct > 0 && <p className="text-xs opacity-70">({formatNumber(pct)}%)</p>}
        </div>
      </div>
    </div>
  );
};
