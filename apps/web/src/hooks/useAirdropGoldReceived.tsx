import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { useEmpires } from "@/hooks/useEmpires";

export const useAirdropGoldReceived = (empire: EEmpire, overrideCount: bigint): bigint => {
  const { tables } = useCore();
  const empires = useEmpires();
  const time = tables.Time.use();

  return useMemo(() => {
    const ownedPlanets = [...empires.entries()].map(([key, data]) => ({
      key,
      planets: tables.Planet.getAllWith({ empireId: key }),
    }));

    const survivingEmpireCount = ownedPlanets.filter(({ key, planets }) => planets.length > 0).length;

    const opposingPlanetCount = ownedPlanets.reduce((sum, { key, planets }) => {
      if (key !== empire && planets.length > 0) {
        return sum + BigInt(planets.length ?? 0);
      }
      return sum;
    }, 0n);

    const averagePlanetsPerOpposingEmpire =
      (opposingPlanetCount + BigInt(survivingEmpireCount) - 1n) / BigInt(survivingEmpireCount);

    return overrideCount * averagePlanetsPerOpposingEmpire;
  }, [empire, overrideCount, empires, time]);
};
