export * from "./mappings/index";
export { pack } from "./pack.ts";
export { AnimationConfig } from "./animationConfig.ts";

export const Assets = {
  SpriteAtlas: "sprite-atlas",
  VfxAtlas: "vfx-atlas",
  ResourceTileset: "resource",
  AudioAtlas: "audio-atlas",
} as const;
