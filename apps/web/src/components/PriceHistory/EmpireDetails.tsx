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
import { DEFAULT_EMPIRE } from "@/util/lookups";

// TODO: Change window size to use time instead of # of updates
const WINDOW_SIZE = 25;

const _EmpireDetails: React.FC<{ empire: EEmpire; hideGraph?: boolean }> = ({ empire, hideGraph = false }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const { price: sellPrice } = usePointPrice(empire, 1);
  const planetCount = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId: DEFAULT_EMPIRE })?.itemKeys.length ?? 0;
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

  return (
    <div className="flex flex-col justify-center rounded-box text-center text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <p className="text-md absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-xs text-accent opacity-75">
            {planetCount}
          </p>
          <img src={spriteUrl} className="h-12" />
        </div>

        <div className={cn("flex flex-col items-start gap-1")}>
          <Price wei={sellPrice} />

          <p className="text-xs opacity-75">
            {citadelCount}/{citadelPlanets.length} Citadels
          </p>
        </div>
        {!hideGraph && <SmallHistoricalPointGraph width={75} height={25} empire={empire} windowSize={WINDOW_SIZE} />}
      </div>
    </div>
  );
};

export const EmpireDetails: React.FC<{ hideGraph?: boolean }> = ({ hideGraph }) => {
  const empires = useEmpires();
  return (
    <div className="flex flex-col items-start gap-1 text-center">
      {[...empires.keys()].map((empire, index) => (
        <_EmpireDetails key={index} empire={empire} hideGraph={hideGraph} />
      ))}
    </div>
  );
};
