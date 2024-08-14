import { useMemo } from "react";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { allEmpires } from "@primodiumxyz/game";
import { usePoints } from "@/hooks/usePoints";
import { EmpireConfig, EmpireEnumToConfig } from "@/util/lookups";

export const useEmpires = () => {
  const { tables, utils } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;

  const playerPoints = usePoints(entity);
  const time = tables.Time.use()?.value;
  return useMemo(() => {
    return allEmpires.slice(0, empireCount).reduce((acc, empire) => {
      const empirePoints = tables.Value_PointsMap.getWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;
      const pointPrice = utils.getPointPrice(empire, Number(formatEther(playerPoints[empire].playerPoints))).price;

      acc.set(empire, { ...EmpireEnumToConfig[empire], pointPrice, empirePoints });
      return acc;
    }, new Map<EEmpire, EmpireConfig & { empirePoints: bigint; pointPrice: bigint }>());
  }, [empireCount, playerPoints, entity, time]);
};
