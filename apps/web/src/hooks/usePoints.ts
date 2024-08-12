import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { EMPIRES } from "@/util/lookups";

export const usePoints = (playerId: Entity): Record<EEmpire, { playerPoints: bigint; empirePoints: bigint }> => {
  const { tables } = useCore();

  return EMPIRES.reduce(
    (acc, empire) => {
      acc[empire] = {
        playerPoints: tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId })?.value ?? 0n,
        empirePoints: tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n,
      };
      return acc;
    },
    {} as Record<EEmpire, { playerPoints: bigint; empirePoints: bigint }>,
  );
};
