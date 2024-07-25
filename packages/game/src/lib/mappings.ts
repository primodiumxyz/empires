import { EEmpire } from "@primodiumxyz/contracts";
import { AnimationKeys, SpriteKeys } from "@primodiumxyz/assets";

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

export const EmpireToConquerAnimationKeys: Record<
  EEmpire,
  AnimationKeys | undefined
> = {
  [EEmpire.Red]: "ConquerRed",
  [EEmpire.Green]: "ConquerGreen",
  [EEmpire.Blue]: "ConquerBlue",
  [EEmpire.LENGTH]: undefined,
};
