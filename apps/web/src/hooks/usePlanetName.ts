import { useMemo } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export const usePlanetName = (entity: Entity) => {
  const { utils } = useCore();

  return useMemo(() => utils.generatePlanetName(entity), [entity]);
};
