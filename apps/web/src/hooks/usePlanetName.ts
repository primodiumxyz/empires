import { useMemo } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export const usePlanetName = (entity: Entity) => {
  const { utils, tables } = useCore();
  const planetName = tables.PlanetName.use(entity)?.name;

  return useMemo(() => planetName ?? utils.generatePlanetName(entity), [planetName, entity]);
};
