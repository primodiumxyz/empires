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
  Planet: 1000,
  Marker: 2000,
} as const;
