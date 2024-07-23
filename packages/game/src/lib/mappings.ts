import { EEmpire } from "@primodiumxyz/contracts";
import { Sprites } from "@primodiumxyz/assets";

export const EmpireToEmpireSprites: Record<EEmpire, string | undefined> = {
  [EEmpire.Red]: Sprites.EmpireRed,
  [EEmpire.Green]: Sprites.EmpireGreen,
  [EEmpire.Blue]: Sprites.EmpireBlue,
  [EEmpire.LENGTH]: undefined,
};
