import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { SecondaryCard } from "@/components/core/Card";
import { Price } from "@/components/shared/Price";
import { EmpireData, useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useWinRate } from "@/hooks/useWinRate";
import { cn } from "@/util/client";
import { EmpireConfig } from "@/util/lookups";

export const EmpireCards = () => {
  const empires = useEmpires();
  return (
    <div className={cn("pointer-events-auto flex h-full flex-col gap-2 overflow-y-auto pr-2 lg:!grid lg:grid-cols-2")}>
      {[...empires.entries()]
        .sort((a, b) => Number(b[1].playerPoints) - Number(a[1].playerPoints))
        .map(([key, data]) => (
          <EmpireCard key={key} empire={key} {...data} />
        ))}
    </div>
  );
};

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

  const planetCount = tables.Planet.getAll().length ?? 0;
  const citadelCount = tables.Planet.getAllWith({ isCitadel: true }).length ?? 0;

  return (
    <SecondaryCard>
      <div className="grid grid-cols-[3rem_1fr_auto] grid-rows-[1rem_1rem_1rem] items-center gap-x-2 lg:grid-cols-[4rem_1fr_auto] lg:grid-rows-[1fr_auto_auto]">
        <div className="row-span-3 mx-auto">
          <img src={sprite.getSprite(sprites.planet)} className="w-6 lg:w-8" />
        </div>
        <span className="text-sm font-bold text-accent lg:text-lg">{name}</span>
        <Price wei={pointPrice} className="text-right text-sm lg:text-lg" />
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2">
            <img src={sprite.getSprite("Crown")} className="w-3 lg:w-4" />
            <span className="text-[10px] lg:text-base">
              {ownedCitadelCount}/{citadelCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <img src={sprite.getSprite("PlanetGrey")} className="w-3 lg:w-4" />
            <span className="text-[10px] lg:text-base">{ownedPlanetCount}</span>
          </div>
        </div>
        <div className="items-center gap-0 text-right text-accent lg:text-base">
          <p className="hidden text-[0.6rem] opacity-50 lg:block">YOU OWN</p>
          <p className="-mt-2">{formatEther(playerPoints)} pts</p>
        </div>
        <p className="col-span-2 inline w-full text-xs uppercase opacity-75 lg:!text-sm">win chance: {winRate}%</p>
      </div>
    </SecondaryCard>
  );
};
