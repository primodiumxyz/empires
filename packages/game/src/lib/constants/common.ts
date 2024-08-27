import { EEmpire } from "@primodiumxyz/contracts";

export const ASSET_PACK = "/assets/pack.json";
export const KEY = "MAIN";

export const allEmpires = [
  EEmpire.Red,
  EEmpire.Blue,
  EEmpire.Green,
  EEmpire.Yellow,
  EEmpire.Purple,
  EEmpire.Pink,
  EEmpire.Orange,
  EEmpire.Black,
  EEmpire.White,
] as const;

export const Scenes = {
  UI: "UI",
  Root: "ROOT",
  Main: "MAIN",
} as const;

export type SceneKeys = (typeof Scenes)[keyof typeof Scenes];

export const DepthLayers = {
  Base: 0,
  PendingArrows: 1000,
  Planet: 2000,
  Citadel: 3000,
  MagnetWaves: 4000,
  ShieldEater: 5000,
  AcidRain: 6000,
  Magnet: 7000,
  Marker: 8000,
} as const;
