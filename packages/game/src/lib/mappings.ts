import { AnimationKeys, SpriteKeys } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";

export const EmpireToPlanetSpriteKeys: Record<EEmpire, SpriteKeys | undefined> = {
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

export const EmpireToConquerAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "ConquerRed",
  [EEmpire.Green]: "ConquerGreen",
  [EEmpire.Blue]: "ConquerBlue",
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToPendingAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "PendingRed",
  [EEmpire.Green]: "PendingGreen",
  [EEmpire.Blue]: "PendingBlue",
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToDestroyerArcAnimationKeys: Record<
  EEmpire,
  [lower: AnimationKeys | undefined, upper: AnimationKeys | undefined]
> = {
  [EEmpire.Red]: ["DestroyerArcLowerRed", "DestroyerArcUpperRed"],
  [EEmpire.Green]: ["DestroyerArcLowerGreen", "DestroyerArcUpperGreen"],
  [EEmpire.Blue]: ["DestroyerArcLowerBlue", "DestroyerArcUpperBlue"],
  [EEmpire.LENGTH]: [undefined, undefined],
};
