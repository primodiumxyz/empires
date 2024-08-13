import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useEmpires } from "@/hooks/useEmpires";

export const usePoints = (playerId: Entity): Record<EEmpire, { playerPoints: bigint; empirePoints: bigint }> => {
  const { tables } = useCore();
  const empires = useEmpires();
  const time = tables.Time.use();

  return useMemo(
    () =>
      [...empires.keys()].reduce(
        (acc, empire) => {
          acc[empire] = {
            playerPoints: tables.Value_PointsMap.getWithKeys({ empireId: empire, playerId })?.value ?? 0n,
            empirePoints: tables.Empire.getWithKeys({ id: empire })?.pointsIssued ?? 0n,
          };
          return acc;
        },
        {} as Record<EEmpire, { playerPoints: bigint; empirePoints: bigint }>,
      ),
    [empires, time],
  );
};
