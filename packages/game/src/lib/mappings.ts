import { EEmpire } from "@primodiumxyz/contracts";
import { SpriteKeys } from "@primodiumxyz/assets";

export const EmpireToPlanetSpriteKeys: Record<EEmpire, SpriteKeys | undefined> =
  {
    [EEmpire.Red]: "PlanetRed",
    [EEmpire.Green]: "PlanetGreen",
    [EEmpire.Blue]: "PlanetBlue",
    [EEmpire.LENGTH]: undefined,
  };

export const EmpireToHexSpriteKeys: Record<EEmpire, SpriteKeys | undefined> = {
  [EEmpire.Red]: "HexRed",
  [EEmpire.Green]: "HexGreen",
  [EEmpire.Blue]: "HexBlue",
  [EEmpire.LENGTH]: undefined,
};
