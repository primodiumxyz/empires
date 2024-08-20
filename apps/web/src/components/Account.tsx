import { useMemo } from "react";
import { UserIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatAddress, formatNumber } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Price } from "@/components/shared/Price";
import { useBalance } from "@/hooks/useBalance";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

export const Account: React.FC<{ hideAccountBalance?: boolean; justifyStart?: boolean }> = ({
  hideAccountBalance = false,
  justifyStart = false,
}) => {
  const {
    playerAccount: { address, entity },
  } = useAccountClient();

  const balance = useBalance(address).value ?? 0n;
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
      <div className="flex flex-col justify-center gap-1">
        {!hideAccountBalance && (
          <>
            <div className="flex w-full flex-row justify-end gap-2">
              <UserIcon className="w-4" />
              <p>{formatAddress(address)}</p>
            </div>
            <Price wei={balance} className="text-sm text-accent" />
            <hr className="my-1 w-full border-secondary/50" />
            {!noPlanets && <p className="text-xs opacity-70">Your Portfolio</p>}
          </>
        )}
        {noPlanets && <p className="text-center text-xs opacity-70">You own no empires</p>}
        <div className="flex max-h-[70vh] flex-col overflow-y-auto">
          {sortedEmpires.map((empire, index) => (
            <EmpirePoints key={index} empire={empire} playerId={entity} justifyStart={justifyStart} />
          ))}
        </div>
      </div>
    </div>
  );
};

const EmpirePoints = ({
  empire,
  playerId,
  justifyStart = false,
}: {
  empire: EEmpire;
  playerId: Entity;
  justifyStart?: boolean;
}) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();

  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId })?.value ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pctTimes10000 = empirePoints > 0 ? (playerPoints * 10000n) / empirePoints : 0n;
  const pct = Number(pctTimes10000) / 100;

  const { price: pointCostWei } = usePointPrice(empire, Number(formatEther(playerPoints)));

  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");
  if (playerPoints === 0n) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex h-9 w-full items-center gap-5 border-none py-1 lg:h-14",
        justifyStart ? "justify-start" : "justify-between",
      )}
    >
      <img src={spriteUrl} className="w-6 lg:w-10" />
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
