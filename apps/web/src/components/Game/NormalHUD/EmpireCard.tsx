import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Card, SecondaryCard } from "@/components/core/Card";
import { Tooltip } from "@/components/core/Tooltip";
import { Price } from "@/components/shared/Price";
import { EmpireData } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useWinRate } from "@/hooks/useWinRate";
import { EmpireConfig } from "@/util/lookups";

export const EmpireCard = ({
  empire,
  name,
  sprites,
  empirePoints,
  playerPoints,
  pointPrice,
  ownedPlanetCount,
  ownedCitadelCount,
}: EmpireConfig & EmpireData & { empire: EEmpire }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const winRate = useWinRate(empire);
  const pctTimes10000 = empirePoints > 0 ? (playerPoints * 10000n) / empirePoints : 0n;
  const pct = Number(pctTimes10000) / 100;

  const planetCount = tables.Planet.getAll().length ?? 0;
  const citadelCount = tables.Planet.getAllWith({ isCitadel: true }).length ?? 0;

  return (
    <SecondaryCard>
      <div className="grid grid-cols-[4rem_1fr_auto] grid-rows-[1fr_auto_auto] items-center gap-x-2">
        <div className="row-span-3 mx-auto">
          <img src={sprite.getSprite(sprites.planet)} className="w-8" />
        </div>
        <span className="text-lg font-bold text-accent">{name}</span>
        <Price wei={pointPrice} className="text-lg" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={sprite.getSprite("Crown")} className="w-4" />
            <span>
              {ownedCitadelCount}/{citadelCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <img src={sprite.getSprite("PlanetGrey")} className="w-4" />
            <span>
              {ownedPlanetCount}/{planetCount}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 text-accent">
          {formatEther(playerPoints)} pts{" "}
          <Tooltip className="w-44 text-gray-400" direction="left" tooltipContent="Points you own for this empire">
            <InformationCircleIcon className="size-4 text-gray-400" />
          </Tooltip>
        </div>
        <div className="inline-flex items-center gap-2 opacity-75">
          win rate: {winRate}%{" "}
          <Tooltip
            className="w-64"
            tooltipContent="Based on the number of planets and citadels owned, as well as how close the game is to the end"
          >
            <InformationCircleIcon className="size-4 text-gray-400" />
          </Tooltip>
        </div>
        <span className="text-xs text-accent">{pct > 0 && `(${formatNumber(pct)}%)`}</span>
      </div>
    </SecondaryCard>
  );
};
