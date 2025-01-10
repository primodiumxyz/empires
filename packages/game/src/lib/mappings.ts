import { AnimationKeys, SpriteKeys } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";

export const EmpireToPlanetSpriteKeys: Record<EEmpire, SpriteKeys | undefined> = {
  [EEmpire.Red]: "PlanetRed",
  [EEmpire.Green]: "PlanetGreen",
  [EEmpire.Blue]: "PlanetBlue",
  [EEmpire.Yellow]: "PlanetYellow",
  [EEmpire.Pink]: "PlanetPink",
  [EEmpire.Purple]: "PlanetPurple",
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToHexSpriteKeys: Record<EEmpire, SpriteKeys | undefined> = {
  [EEmpire.Red]: "HexRed",
  [EEmpire.Green]: "HexGreen",
  [EEmpire.Blue]: "HexBlue",
  [EEmpire.Yellow]: "HexYellow",
  [EEmpire.Pink]: "HexPink",
  [EEmpire.Purple]: "HexPurple",
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToConquerAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "ConquerRed",
  [EEmpire.Green]: "ConquerGreen",
  [EEmpire.Blue]: "ConquerBlue",
  [EEmpire.Yellow]: "ConquerYellow",
  [EEmpire.Pink]: "ConquerPink",
  [EEmpire.Purple]: "ConquerPurple",
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToPendingAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "PendingRed",
  [EEmpire.Green]: "PendingGreen",
  [EEmpire.Blue]: "PendingBlue",
  [EEmpire.Yellow]: "PendingYellow",
  [EEmpire.Pink]: "PendingPink",
  [EEmpire.Purple]: "PendingPurple",
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToMovementAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "MovementRed",
  [EEmpire.Green]: "MovementGreen",
  [EEmpire.Blue]: "MovementBlue",
  [EEmpire.Yellow]: "MovementYellow",
  [EEmpire.Pink]: "MovementPink",
  [EEmpire.Purple]: "MovementPurple",
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToMagnetAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "MagnetRed",
  [EEmpire.Green]: "MagnetGreen",
  [EEmpire.Blue]: "MagnetBlue",
  [EEmpire.Yellow]: "MagnetYellow",
  [EEmpire.Pink]: "MagnetPink",
  [EEmpire.Purple]: "MagnetPurple",
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToHexColor: Record<EEmpire, string> = {
  [EEmpire.Red]: "#ff0000",
  [EEmpire.Green]: "#00ff00",
  [EEmpire.Blue]: "#0000ff",
  [EEmpire.Yellow]: "#ffff00",
  [EEmpire.Pink]: "#ff00ff",
  [EEmpire.Purple]: "#800080",
  [EEmpire.Orange]: "#ffa500",
  [EEmpire.Black]: "#000000",
  [EEmpire.White]: "#ffffff",
  [EEmpire.LENGTH]: "#ffffff",
};
