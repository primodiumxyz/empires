import { useEffect, useMemo, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";

export const useShieldEater = (): {
  currentPlanet: Entity;
  cooldownBlocks: bigint;
  cooldownMs: number | undefined;
} => {
  const { tables } = useCore();
  const detonationCooldown = tables.P_ShieldEaterConfig.use()?.detonationCooldown ?? 0n;
  const shieldEaterData = tables.ShieldEater.use();
  const { value: blockNumber, avgBlockTime } = tables.BlockNumber.use() ?? { value: 0n, avgBlockTime: 0n };

  const [cooldownBlocks, setCooldownBlocks] = useState(0n);
  const [cooldownMs, setCooldownMs] = useState<number>();

  useEffect(() => {
    if (!shieldEaterData) return;

    const updateCooldown = () => {
      const elapsed = blockNumber - shieldEaterData.lastDetonationBlock;
      const newCooldownBlocks = detonationCooldown > elapsed ? detonationCooldown - elapsed : 0n;
      setCooldownBlocks(newCooldownBlocks);

      const cooldownTimeMs = Number(newCooldownBlocks) * Number(avgBlockTime) * 1000;
      setCooldownMs(cooldownTimeMs);
    };

    updateCooldown();

    const interval = setInterval(() => {
      setCooldownMs((prevMs) => (prevMs && prevMs > 1000 ? prevMs - 1000 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [shieldEaterData, blockNumber, avgBlockTime, detonationCooldown]);

  return {
    currentPlanet: (shieldEaterData?.currentPlanet as Entity) ?? defaultEntity,
    cooldownBlocks,
    cooldownMs,
  };
};
