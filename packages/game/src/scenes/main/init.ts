// ROOT ENTRY POINT
import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { PrimodiumScene } from "@game/types";
import { runSystems as runMainSystems } from "@game/scenes/main/systems";
import { mainSceneConfig } from "@game/lib/config/mainScene";
import { Assets, Sprites } from "@primodiumxyz/assets";

export const initMainScene = async (
  game: GlobalApi,
  core: Core
): Promise<PrimodiumScene> => {
  const scene = await game.createScene(mainSceneConfig, true);

  const sceneApi = createSceneApi(scene, game);
  sceneApi.audio.setPauseOnBlur(false);

  scene.camera.phaserCamera.centerOn(0, -50);
  scene.camera.phaserCamera.fadeIn();
  scene.camera.phaserCamera.postFX?.addVignette(0.5, 0.5, 0.8);

  //setup background here since using transparent phaser background breaks blend modes and some shaders. Idk y and can't find anything in regards to this
  scene.phaserScene.add
    .tileSprite(
      0,
      0,
      scene.phaserScene.sys.canvas.width,
      scene.phaserScene.sys.canvas.height,
      Assets.SpriteAtlas,
      Sprites.StarBg
    )
    .setDepth(-10_000_000)
    .postFX.addShine();
  scene.phaserScene.add
    .image(0, 0, Assets.SpriteAtlas, Sprites.Nebula)
    .setScale(1.75)
    .setAlpha(0.35)
    .setDepth(-10_000_000);

  const runSystems = () => runMainSystems(sceneApi, game, core);
  return { ...sceneApi, runSystems };
};
