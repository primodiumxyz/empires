import { useMemo } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

// TODO: provide an estimate of when it will have enough shields to detonate
export const useShieldEater = (): {
  currentPlanet: Entity | undefined;
  cooldownShields: number;
} => {
  const { tables } = useCore();
  const detonationThreshold = tables.P_ShieldEaterConfig.use()?.detonationThreshold ?? 0n;
  const shieldEaterData = tables.ShieldEater.use();

  const cooldownShields = useMemo(() => {
    return Math.max(0, Number(detonationThreshold - (shieldEaterData?.currentCharge ?? 0n)));
  }, [detonationThreshold, shieldEaterData?.currentCharge]);

  return {
    currentPlanet: shieldEaterData?.currentPlanet as Entity | undefined,
    cooldownShields,
  };
};
