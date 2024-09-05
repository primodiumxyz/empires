import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Badge } from "@/components/core/Badge";
import { SecondaryCard } from "@/components/core/Card";
import { EmpireLogo } from "@/components/shared/EmpireLogo";
import { Price } from "@/components/shared/Price";
import { EmpireData, useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useWinRate } from "@/hooks/useWinRate";
import { cn } from "@/util/client";
import { EmpireConfig } from "@/util/lookups";

export const EmpireCards = () => {
  const empires = useEmpires();
  return (
    <div className={cn("pointer-events-auto flex h-full flex-col gap-2 overflow-y-auto pr-1 lg:!grid lg:grid-cols-2")}>
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

  const citadelCount = tables.Planet.getAllWith({ isCitadel: true }).length ?? 0;

  return (
    <SecondaryCard className="justify-center">
      <div className="grid grid-cols-[3rem_1fr_auto] grid-rows-[1rem_1rem] items-center gap-x-2 lg:grid-cols-[4rem_1fr_auto] lg:grid-rows-[1fr_auto_auto]">
        <EmpireLogo empireId={empire} size="xl" className="row-span-3 mx-auto" />
        <p className="inline text-accent lg:text-base">
          {formatEther(playerPoints)}
          <span className="text-xs"> pts </span>
          <span className="hidden text-[0.6rem] opacity-50 lg:inline">YOU OWN</span>
        </p>
        <Price wei={pointPrice} className="text-right text-sm lg:text-lg" />
        <p className="inline w-full text-xs uppercase opacity-75 lg:!text-sm">
          win <span className="hidden lg:inline">chance</span>: {winRate}%
        </p>
        <div />

        <div className="flex items-center gap-4 lg:gap-6">
          <Badge className="gap-1 p-2" variant="neutral">
            <img src={sprite.getSprite("Crown")} className="w-3 lg:w-4" />
            <span className="text-xs">
              {ownedCitadelCount}/{citadelCount}
            </span>
          </Badge>
          <Badge className="gap-1 p-2" variant="neutral">
            <img src={sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey")} className="w-3 lg:w-4" />
            <span className="text-xs">{ownedPlanetCount}</span>
          </Badge>
        </div>
      </div>
    </SecondaryCard>
  );
};
