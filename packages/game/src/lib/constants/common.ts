export const ASSET_PACK = "/assets/pack.json";
export const KEY = "MAIN";

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
  Marker: 3000,
} as const;
