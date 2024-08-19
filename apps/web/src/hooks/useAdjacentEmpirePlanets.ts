import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export function useAdjacentEmpirePlanets(planetId: Entity, empire: EEmpire) {
  const { tables, utils } = useCore();
  const time = tables.Time.use()?.value;

  const adjacentEmpirePlanets = useMemo(() => {
    const allNeighbors = utils.getAllNeighbors(planetId);

    return allNeighbors.filter((neighborId) => {
      const neighborPlanet = tables.Planet.get(neighborId);
      return neighborPlanet?.empireId === empire;
    });
  }, [planetId, empire, tables.Planet, utils, time]);

  return adjacentEmpirePlanets;
}
