import { useMemo } from "react";

import { SpriteKeys } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { allEmpires } from "@primodiumxyz/game";
import { EmpireEnumToConfig } from "@/util/lookups";

export const useEmpires = () => {
  const { tables } = useCore();
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;
  return useMemo(() => {
    return allEmpires.slice(0, empireCount).reduce(
      (acc, empire) => {
        acc.set(empire, EmpireEnumToConfig[empire]);
        return acc;
      },
      new Map<
        EEmpire,
        {
          name: string;
          textColor: string;
          chartColor: string;
          icons: { magnet: string };
          sprites: { planet: SpriteKeys };
        }
      >(),
    );
  }, [empireCount]);
};
