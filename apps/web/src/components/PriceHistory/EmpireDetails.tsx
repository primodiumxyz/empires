import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { SmallHistoricalPointGraph } from "@/components/PriceHistory/SmallHistoricalPointGraph";
import { Price } from "@/components/shared/Price";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

// TODO: Change window size to use time instead of # of updates
const WINDOW_SIZE = 25;

const _EmpireDetails: React.FC<{ empire: EEmpire; hideGraph?: boolean; hidePlanets?: boolean }> = ({
  empire,
  hideGraph = false,
  hidePlanets = false,
}) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const { price: sellPrice } = usePointPrice(empire, 1);
  const planetCount = tables.Keys_EmpirePlanetsSet.useWithKeys({ empireId: empire })?.itemKeys.length ?? 0;
  const citadelPlanets = tables.Keys_CitadelPlanetsSet.useWithKeys()?.itemKeys ?? [];
  // TODO: something better
  const block = tables.BlockNumber.use()?.value ?? 0n;

  const citadelCount = useMemo(() => {
    let count = 0;
    for (const entity of citadelPlanets) {
      const planet = tables.Planet.get(entity as Entity);

      if (!planet) continue;

      if (planet.empireId !== empire) continue;

      if (planet.isCitadel) count++;
    }

    return count;
  }, [citadelPlanets, empire, block]);

  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");
  const crownUrl = sprite.getSprite("Crown");

  return (
    <div className="flex h-9 items-center justify-center gap-3 text-white lg:h-14">
      <img src={spriteUrl} className="w-6 lg:w-10" />

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

export const EmpireDetails: React.FC<{ hideGraph?: boolean; hideTitle?: boolean; hidePlanets?: boolean }> = ({
  hideGraph,
  hideTitle,
  hidePlanets,
}) => {
  const empires = useEmpires();
  const { tables } = useCore();
  const time = tables.BlockNumber.use()?.value ?? 0n;
  const sortedEmpires = useMemo(() => {
    return [...empires.keys()].sort((a, b) => {
      const citadelPlanetsA = tables.Keys_CitadelPlanetsSet.getWithKeys()?.itemKeys ?? [];
      const citadelPlanetsB = tables.Keys_CitadelPlanetsSet.getWithKeys()?.itemKeys ?? [];

      const citadelCountA = citadelPlanetsA.filter(
        (entity) =>
          tables.Planet.get(entity as Entity)?.empireId === a && tables.Planet.get(entity as Entity)?.isCitadel,
      ).length;

      const citadelCountB = citadelPlanetsB.filter(
        (entity) =>
          tables.Planet.get(entity as Entity)?.empireId === b && tables.Planet.get(entity as Entity)?.isCitadel,
      ).length;

      if (citadelCountA !== citadelCountB) {
        return citadelCountB - citadelCountA; // Sort by citadel count descending
      }

      const planetCountA = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId: a })?.itemKeys.length ?? 0;
      const planetCountB = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId: b })?.itemKeys.length ?? 0;

      return planetCountB - planetCountA; // Then sort by planet count descending
    });
  }, [empires, tables, time]);
  return (
    <div className="flex flex-col items-start overflow-y-auto text-center">
      {!hideTitle && <p className="text-xs opacity-70">Empires</p>}
      {sortedEmpires.map((empire, index) => (
        <_EmpireDetails key={index} empire={empire} hideGraph={hideGraph} hidePlanets={hidePlanets} />
      ))}
    </div>
  );
};
