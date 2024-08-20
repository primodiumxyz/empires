import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { SecondaryCard } from "@/components/core/Card";
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
      <div className="grid grid-cols-[3rem_1fr_auto] grid-rows-[1rem_1rem_1rem] items-center gap-x-2 lg:grid-cols-[4rem_1fr_auto] lg:grid-rows-[1fr_auto_auto]">
        <div className="row-span-3 mx-auto">
          <img src={sprite.getSprite(sprites.planet)} className="w-6 lg:w-8" />
        </div>
        <span className="text-sm font-bold text-accent lg:text-lg">{name}</span>
        <Price wei={pointPrice} className="text-sm lg:text-lg" />
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2">
            <img src={sprite.getSprite("Crown")} className="w-3 lg:w-4" />
            <span className="text-[10px] lg:text-base">
              {ownedCitadelCount}/{citadelCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <img src={sprite.getSprite("PlanetGrey")} className="w-3 lg:w-4" />
            <span className="text-[10px] lg:text-base">
              {ownedPlanetCount}/{planetCount}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 text-[10px] text-accent lg:text-base">
          {formatEther(playerPoints)} pts{" "}
          <Tooltip className="w-44 text-gray-400" direction="left" tooltipContent="Points you own for this empire">
            <InformationCircleIcon className="size-3 text-gray-400 lg:size-4" />
          </Tooltip>
        </div>
        <div className="inline-flex items-center gap-2 text-[10px] opacity-75 lg:text-base">
          win rate: {winRate}%{" "}
          <Tooltip
            className="w-64"
            tooltipContent="Based on the number of planets and citadels owned, as well as how close the game is to the end"
          >
            <InformationCircleIcon className="size-3 text-gray-400 lg:size-4" />
          </Tooltip>
        </div>
        <span className="text-[10px] text-accent">{pct > 0 && `(${formatNumber(pct)}%)`}</span>
      </div>
    </SecondaryCard>
  );
};
