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

export const EmpireToMagnetAnimationKeys: Record<EEmpire, AnimationKeys | undefined> = {
  [EEmpire.Red]: "MagnetRed",
  [EEmpire.Green]: "MagnetGreen",
  [EEmpire.Blue]: "MagnetBlue",
  [EEmpire.LENGTH]: undefined,
};

export const EmpireToHexColor: Record<EEmpire, string> = {
  [EEmpire.Red]: "#ff0000",
  [EEmpire.Green]: "#00ff00",
  [EEmpire.Blue]: "#0000ff",
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
  [EEmpire.LENGTH]: undefined,
};

type OverheatProgress = "low" | "medium" | "full";
export const OverheatThresholdToFlameAnimationKeys: Record<OverheatProgress, AnimationKeys> = {
  low: "OverheatFlamesLow",
  medium: "OverheatFlamesMedium",
  full: "OverheatFlamesFull",
};
