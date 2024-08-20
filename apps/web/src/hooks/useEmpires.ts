import { useMemo } from "react";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { allEmpires } from "@primodiumxyz/game";
import { EmpireConfig, EmpireEnumToConfig } from "@/util/lookups";

export type EmpireData = {
  empirePoints: bigint;
  pointPrice: bigint;
  playerPoints: bigint;
  ownedPlanetCount: number;
  ownedCitadelCount: number;
};

export const useEmpires = () => {
  const { tables, utils } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;

  const time = tables.Time.use()?.value;
  return useMemo(() => {
    return allEmpires.slice(0, empireCount).reduce((acc, empire) => {
      const empirePoints = tables.Value_PointsMap.getWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
      const playerPoints = tables.Value_PointsMap.getWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
      const pointPrice = utils.getPointPrice(empire, Number(formatEther(playerPoints))).price;

      const ownedPlanetCount = tables.Planet.useAllWith({ empireId: empire })?.length ?? 0;
      const ownedCitadelCount = tables.Planet.useAllWith({ empireId: empire, isCitadel: true })?.length ?? 0;

      acc.set(empire, {
        ...EmpireEnumToConfig[empire],
        pointPrice,
        empirePoints,
        playerPoints,
        ownedPlanetCount,
        ownedCitadelCount,
      });
      return acc;
    }, new Map<EEmpire, EmpireConfig & EmpireData>());
  }, [empireCount, entity, time]);
};
