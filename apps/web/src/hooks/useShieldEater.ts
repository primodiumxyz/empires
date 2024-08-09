import { useMemo } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";

export const useShieldEater = (): {
  currentPlanet: Entity;
  cooldownShields: bigint;
} => {
  const { tables } = useCore();
  const detonationThreshold = tables.P_ShieldEaterConfig.use()?.detonationThreshold ?? 0n;
  const shieldEaterData = tables.ShieldEater.use();

  const cooldownShields = useMemo(() => {
    return detonationThreshold - (shieldEaterData?.currentCharge ?? 0n);
  }, [detonationThreshold, shieldEaterData?.currentCharge]);

  return {
    currentPlanet: (shieldEaterData?.currentPlanet as Entity) ?? defaultEntity,
    cooldownShields,
  };
};
