import { useEffect, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

export const useCharge = (planetId: Entity): { charge: bigint; maxCharge: bigint; percent: number } => {
  const { tables } = useCore();

  const maxCharge = tables.P_TacticalStrikeConfig.use()?.maxCharge ?? 0n;
  const planetTacticalStrikeData = tables.Planet_TacticalStrike.useWithKeys({ planetId });
  const { value: blockNumber, avgBlockTime } = tables.BlockNumber.use() ?? { value: 0n, avgBlockTime: 0 };
  const [currentCharge, setCurrentCharge] = useState(0n);

  useEffect(() => {
    if (!planetTacticalStrikeData) return;

    const updateCharge = () => {
      const blocksElapsed = blockNumber - planetTacticalStrikeData.lastUpdated;
      const newCharge = planetTacticalStrikeData.charge + (blocksElapsed * planetTacticalStrikeData.chargeRate) / 100n;
      setCurrentCharge(newCharge);
    };

    updateCharge();
    const interval = setInterval(updateCharge, 100);

    return () => clearInterval(interval);
  }, [planetTacticalStrikeData, blockNumber]);

  return { charge: currentCharge, maxCharge, percent: (Number(currentCharge) / Number(maxCharge)) * 100 };
};
