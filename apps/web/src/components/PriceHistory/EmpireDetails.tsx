import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { SmallHistoricalPointGraph } from "@/components/PriceHistory/SmallHistoricalPointGraph";
import { Price } from "@/components/shared/Price";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";

// TODO: Change window size to use time instead of # of updates
const WINDOW_SIZE = 25;

const _EmpireDetails: React.FC<{ empire: EEmpire; hideGraph?: boolean }> = ({ empire, hideGraph = false }) => {
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
    <div className="flex flex-col justify-center rounded-box text-center text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex h-10 items-center justify-center lg:h-16">
          <p className="text-md absolute left-1/2 top-1/2 h-4 w-5 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black text-xs text-accent opacity-75">
            {planetCount}
          </p>
          <img src={spriteUrl} className="w-8 lg:w-10" />
        </div>

        <div className={cn("flex flex-col items-start")}>
          <Price wei={sellPrice} />

          <p className="flex items-center gap-1 text-xs opacity-75">
            <img src={crownUrl} className="w-4" />
            <span>{citadelCount}</span>
          </p>
        </div>
        {!hideGraph && <SmallHistoricalPointGraph width={40} height={25} empire={empire} windowSize={WINDOW_SIZE} />}
      </div>
    </div>
  );
};

export const EmpireDetails: React.FC<{ hideGraph?: boolean; hideTitle?: boolean }> = ({ hideGraph, hideTitle }) => {
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
    <div className="flex max-h-[80vh] flex-col items-start gap-1 overflow-y-auto text-center">
      {!hideTitle && <p className="text-xs opacity-70">Empires</p>}
      {sortedEmpires.map((empire, index) => (
        <_EmpireDetails key={index} empire={empire} hideGraph={hideGraph} />
      ))}
    </div>
  );
};
