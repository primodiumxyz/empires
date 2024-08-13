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
  [EEmpire.Yellow]: "PendingBlue",
  [EEmpire.Pink]: "PendingBlue",
  [EEmpire.Purple]: "PendingBlue",
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
  [EEmpire.Yellow]: "MagnetBlue",
  [EEmpire.Pink]: "MagnetBlue",
  [EEmpire.Purple]: "MagnetBlue",
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

type HexagonFraction = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const EmpireOverheatThresholdToBorderSpriteKeys: Record<
  EEmpire,
  Record<HexagonFraction, SpriteKeys> | undefined
> = {
  [EEmpire.Red]: {
    0: "OverheatBorder0",
    1: "OverheatBorderRed1",
    2: "OverheatBorderRed2",
    3: "OverheatBorderRed3",
    4: "OverheatBorderRed4",
    5: "OverheatBorderRed5",
    6: "OverheatBorderRed6",
  },
  [EEmpire.Green]: {
    0: "OverheatBorder0",
    1: "OverheatBorderGreen1",
    2: "OverheatBorderGreen2",
    3: "OverheatBorderGreen3",
    4: "OverheatBorderGreen4",
    5: "OverheatBorderGreen5",
    6: "OverheatBorderGreen6",
  },
  [EEmpire.Blue]: {
    0: "OverheatBorder0",
    1: "OverheatBorderBlue1",
    2: "OverheatBorderBlue2",
    3: "OverheatBorderBlue3",
    4: "OverheatBorderBlue4",
    5: "OverheatBorderBlue5",
    6: "OverheatBorderBlue6",
  },
  [EEmpire.Yellow]: {
    0: "OverheatBorder0",
    1: "OverheatBorderBlue1",
    2: "OverheatBorderBlue2",
    3: "OverheatBorderBlue3",
    4: "OverheatBorderBlue4",
    5: "OverheatBorderBlue5",
    6: "OverheatBorderBlue6",
  },
  [EEmpire.Pink]: {
    0: "OverheatBorder0",
    1: "OverheatBorderBlue1",
    2: "OverheatBorderBlue2",
    3: "OverheatBorderBlue3",
    4: "OverheatBorderBlue4",
    5: "OverheatBorderBlue5",
    6: "OverheatBorderBlue6",
  },
  [EEmpire.Purple]: {
    0: "OverheatBorder0",
    1: "OverheatBorderBlue1",
    2: "OverheatBorderBlue2",
    3: "OverheatBorderBlue3",
    4: "OverheatBorderBlue4",
    5: "OverheatBorderBlue5",
    6: "OverheatBorderBlue6",
  },
  [EEmpire.Orange]: undefined,
  [EEmpire.Black]: undefined,
  [EEmpire.White]: undefined,
  [EEmpire.LENGTH]: undefined,
};

type OverheatProgress = "low" | "medium" | "full";
export const OverheatThresholdToFlameAnimationKeys: Record<OverheatProgress, AnimationKeys> = {
  low: "OverheatFlamesLow",
  medium: "OverheatFlamesMedium",
  full: "OverheatFlamesFull",
};
