import { useMemo } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useEmpires } from "@/hooks/useEmpires";

export const usePlanetMagnets = (planetId: Entity) => {
  const { tables } = useCore();
  const empires = useEmpires();

  return useMemo(
    () =>
      Array.from(empires.entries()).map(([empire, data]) => {
        return {
          empire,
          exists: !!tables.Magnet.getWithKeys({ planetId, empireId: empire }),
          endTurn: tables.Magnet.getWithKeys({ planetId, empireId: empire })?.endTurn,
          icon: data.icons.magnet,
        };
      }),
    [empires, planetId],
  );
};
