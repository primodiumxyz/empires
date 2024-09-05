import { useEffect, useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useGame } from "@/hooks/useGame";

export const useEmpireLogo = (empireId?: EEmpire) => {
  const { tables, utils } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const logo = tables.EmpireLogo.use((empireId ?? 0).toString() as Entity)?.uri;

  useEffect(() => {
    if (!empireId) return;
    utils.getEmpireLogo(empireId);
    const interval = setInterval(() => {
      if (empireId) {
        utils.getEmpireLogo(empireId);
      }
    }, 1000 * 5);
    return () => clearInterval(interval);
  }, [empireId]);

  return useMemo(
    () => logo || sprite.getSprite(EmpireToPlanetSpriteKeys[empireId ?? 0] ?? "PlanetGrey"),
    [logo, empireId],
  );
};
