import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Badge } from "@/components/core/Badge";
import { SmallHistoricalPointGraph } from "@/components/empires/SmallHistoricalPointGraph";
import { Price } from "@/components/shared/Price";
import { useEmpireLogo } from "@/hooks/useEmpireLogo";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

// TODO: Change window size to use time instead of # of updates
const WINDOW_SIZE = 25;

const Empire: React.FC<{ empire: EEmpire; hideGraph?: boolean; hidePlanets?: boolean }> = ({
  empire,
  hideGraph = false,
  hidePlanets = false,
}) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const { price: sellPrice } = usePointPrice(empire, 1);
  const planetCount = tables.Planet.useAllWith({ empireId: empire })?.length ?? 0;
  const citadelCount = tables.Planet.useAllWith({ empireId: empire, isCitadel: true })?.length ?? 0;

  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");
  const empireLogo = useEmpireLogo(empire);
  const crownUrl = sprite.getSprite("Crown");

  return (
    <div className="flex h-9 items-center justify-center gap-3 text-white lg:h-14">
      <img src={empireLogo} className="w-6 lg:w-10" />

      <div className={cn("flex flex-col-reverse justify-start text-left", hidePlanets && "!flex-row gap-3")}>
        <div className="flex items-center gap-1 text-xs opacity-75">
          <Badge variant="ghost" className="gap-1 px-1">
            <img src={crownUrl} className="w-4" />
            <span>{citadelCount}</span>
          </Badge>

          {!hidePlanets && (
            <Badge variant="ghost" className="gap-1 px-1">
              <img src={spriteUrl} className="w-3" />
              <span>{planetCount}</span>
            </Badge>
          )}
        </div>
        <Price wei={sellPrice} />
      </div>
      {!hideGraph && <SmallHistoricalPointGraph width={40} height={25} empire={empire} windowSize={WINDOW_SIZE} />}
    </div>
  );
};

export const Empires: React.FC<{ hideGraph?: boolean; hideTitle?: boolean; hidePlanets?: boolean }> = ({
  hideGraph,
  hideTitle,
  hidePlanets,
}) => {
  const empires = useEmpires();
  const { tables } = useCore();
  const sortedEmpires = useMemo(() => {
    return [...empires.keys()].sort((a, b) => {
      const citadelCountA = empires.get(a)?.ownedCitadelCount ?? 0;
      const citadelCountB = empires.get(b)?.ownedCitadelCount ?? 0;

      if (citadelCountA !== citadelCountB) {
        return citadelCountB - citadelCountA; // Sort by citadel count descending
      }

      const planetCountA = tables.Planet.getAllWith({ empireId: a })?.length ?? 0;
      const planetCountB = tables.Planet.getAllWith({ empireId: b })?.length ?? 0;

      return planetCountB - planetCountA; // Then sort by planet count descending
    });
  }, [empires, tables]);

  return (
    <div className="flex flex-col items-start overflow-y-auto text-center">
      {!hideTitle && <p className="text-xs opacity-70">Empires</p>}
      {sortedEmpires.map((empire, index) => (
        <Empire key={index} empire={empire} hideGraph={hideGraph} hidePlanets={hidePlanets} />
      ))}
    </div>
  );
};
