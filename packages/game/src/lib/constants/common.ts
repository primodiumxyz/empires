import { EEmpire } from "@primodiumxyz/contracts";

export const ASSET_PACK = "/assets/pack.json";
export const KEY = "MAIN";

export const Empires = [EEmpire.Red, EEmpire.Blue, EEmpire.Green];

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
  MagnetWaves: 3000,
  Magnet: 4000,
  Marker: 5000,
} as const;
