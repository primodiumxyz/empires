import { useMemo } from "react";

import { SpriteKeys } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireEnumToConfig } from "@/util/lookups";

export const useEmpires = () => {
  const { tables } = useCore();
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;
  const empires = [
    EEmpire.Red,
    EEmpire.Blue,
    EEmpire.Green,
    EEmpire.Yellow,
    EEmpire.Purple,
    EEmpire.Orange,
    EEmpire.Pink,
    EEmpire.Black,
    EEmpire.White,
  ] as const;

  return useMemo(() => {
    return empires.slice(0, empireCount).reduce(
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
