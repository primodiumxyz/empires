import { Scene } from "@primodiumxyz/engine";
import { SpriteKeys, Assets, Sprites } from "@primodiumxyz/assets";

const cache = new Map<SpriteKeys, string>();

export const createSpriteApi = (scene: Scene) => {
  function getSpriteBase64(
    spriteKey: SpriteKeys,
    atlasKey = Assets.SpriteAtlas
  ) {
    const spriteAssetKey = Sprites[spriteKey];
    if (!cache.has(spriteKey)) {
      const texture = scene.phaserScene.textures.getBase64(
        atlasKey,
        spriteAssetKey
      );
      cache.set(spriteKey, texture);
      return texture;
    }

    return cache.get(spriteKey) ?? "";
  }

  return {
    getSpriteBase64,
  };
};
