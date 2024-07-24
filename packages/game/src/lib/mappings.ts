import { EEmpire } from "@primodiumxyz/contracts";
import { SpriteKeys } from "@primodiumxyz/assets";

export const EmpireToEmpireSpriteKeys: Record<EEmpire, SpriteKeys | undefined> =
  {
    [EEmpire.Red]: "EmpireRed",
    [EEmpire.Green]: "EmpireGreen",
    [EEmpire.Blue]: "EmpireBlue",
    [EEmpire.LENGTH]: undefined,
  };
