import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export const usePoints = (playerId: Entity): Record<EEmpire, { playerPoints: bigint; empirePoints: bigint }> => {
  const { tables } = useCore();

  const redPlayerPoints = tables.Value_PointsMap.useWithKeys({ empireId: EEmpire.Red, playerId })?.value ?? 0n;
  const bluePlayerPoints = tables.Value_PointsMap.useWithKeys({ empireId: EEmpire.Blue, playerId })?.value ?? 0n;
  const greenPlayerPoints = tables.Value_PointsMap.useWithKeys({ empireId: EEmpire.Green, playerId })?.value ?? 0n;

  const redEmpirePoints = tables.Empire.useWithKeys({ id: EEmpire.Red })?.pointsIssued ?? 0n;
  const blueEmpirePoints = tables.Empire.useWithKeys({ id: EEmpire.Blue })?.pointsIssued ?? 0n;
  const greenEmpirePoints = tables.Empire.useWithKeys({ id: EEmpire.Green })?.pointsIssued ?? 0n;

  return {
    [EEmpire.Red]: {
      playerPoints: redPlayerPoints,
      empirePoints: redEmpirePoints,
    },
    [EEmpire.Blue]: {
      playerPoints: bluePlayerPoints,
      empirePoints: blueEmpirePoints,
    },
    [EEmpire.Green]: {
      playerPoints: greenPlayerPoints,
      empirePoints: greenEmpirePoints,
    },
    [EEmpire.LENGTH]: {
      playerPoints: 0n,
      empirePoints: 0n,
    },
  };
};
