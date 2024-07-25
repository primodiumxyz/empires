import { createSceneManager } from "@engine/lib/core/createSceneManager";
import { GameConfig } from "@engine/lib/types";
import createPhaserScene from "@engine/lib/util/createPhaserScene";
import { getSceneLoadPromise } from "@engine/lib/util/getSceneLoadPromise";
import { deferred } from "@engine/lib/util/deferred";

export const createGame = async (config: GameConfig) => {
  //Initialize Phaser Game
  const phaserGame = new Phaser.Game(config);

  // Wait for phaser to boot
  const [resolve, , promise] = deferred();
  phaserGame.events.on("ready", resolve);
  await promise;

  // Create scene for loading assets
  const phaserScene = createPhaserScene({
    key: "LOAD",
    preload: async (scene: Phaser.Scene) => {
      // Images
      config.assetPack.image?.forEach((image) => {
        scene.load.image(image.key, image.url);
      });

      // Atlas
      config.assetPack.atlas?.forEach((atlas) => {
        scene.load.atlas(atlas.key, atlas.textureURL, atlas.atlasURL);
      });

      // Audio Sprites
      config.assetPack.audioSprite?.forEach((audioSprite) => {
        scene.load.audioSprite(
          audioSprite.key,
          audioSprite.jsonURL,
          audioSprite.urls
        );
      });

      // Tilemaps
      config.assetPack.tilemapTiledJSON?.forEach((tilemap) => {
        scene.load.tilemapTiledJSON(tilemap.key, tilemap.url);
      });

      // Bitmap Fonts
      config.assetPack.bitmapFont?.forEach((bitmapFont) => {
        scene.load.bitmapFont(
          bitmapFont.key,
          bitmapFont.textureURL,
          bitmapFont.fontDataURL
        );
      });
    },
  });

  /* -------------------------- Create Scene Manager -------------------------- */

  const loadScene = new phaserScene();

  phaserGame.scene.add("LOAD", loadScene, true);
  loadScene.input.enabled = false;

  await getSceneLoadPromise(loadScene);
  const sceneManager = createSceneManager(phaserGame);

  /* -------------------------------------------------------------------------- */
  const context = {
    phaserGame,
    sceneManager,
    dispose: () => {
      console.log(config.key + ": Disposing");
      sceneManager.dispose();
      phaserGame.canvas.remove();
      phaserGame.destroy(true);
    },
  };

  console.log(config.key + ": Created Instance");

  return context;
};
