// ROOT ENTRY POINT
import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { PrimodiumScene } from "@game/types";
import { runSystems as runMainSystems } from "@game/scenes/main/systems";
import { mainSceneConfig } from "@game/lib/config/mainScene";
import { Assets, Sprites } from "@primodiumxyz/assets";
import { setupBasicCameraMovement } from "@game/scenes/common/setup/setupBasicCameraMovement";

export const initMainScene = async (
  game: GlobalApi,
  core: Core
): Promise<PrimodiumScene> => {
  const scene = await game.createScene(mainSceneConfig, true);
  const { tables } = core;

  const sceneApi = createSceneApi(scene, game);
  sceneApi.audio.setPauseOnBlur(false);

  scene.camera.phaserCamera.centerOn(0, -50);
  scene.camera.phaserCamera.fadeIn();
  scene.camera.phaserCamera.postFX?.addVignette(0.5, 0.5, 0.65);

  //setup background here since using transparent phaser background breaks blend modes and some shaders. Idk y and can't find anything in regards to this
  scene.phaserScene.add
    .tileSprite(
      0,
      0,
      scene.phaserScene.sys.canvas.width * 5,
      scene.phaserScene.sys.canvas.height * 5,
      Assets.SpriteAtlas,
      Sprites.StarBg
    )
    .setDepth(-Infinity)
    .setScrollFactor(0.25, 0.25)
    .postFX.addShine();
  scene.phaserScene.add
    .image(0, 0, Assets.SpriteAtlas, Sprites.Nebula)
    .setScale(3)
    .setAlpha(0.35)
    .setScrollFactor(0.5, 0.5)
    .setDepth(-Infinity);

  const cameraMovement = setupBasicCameraMovement(
    sceneApi,
    core.network.world,
    {
      doubleClickZoom: false,
      zoomKeybind: false,
    }
  );

  //LOCK CAMERA WHEN SELECTING A PLANET
  tables.SelectedPlanet.watch({
    onChange: ({ properties: { current } }) => {
      if (current?.value) {
        console.log(current);
        cameraMovement.pause();
        const planet = sceneApi.objects.planet.get(current.value);
        if (planet) {
          sceneApi.camera.focusCamera(planet.coord);
        }

        return;
      } else {
        sceneApi.camera.unfocusCamera();
        cameraMovement.resume();
      }
    },
  });

  const clickSub = scene.input.click$.subscribe(([, objects]) => {
    if (objects.length !== 0) return;
    tables.HoveredPlanet.remove();
    tables.SelectedPlanet.remove();
  });

  core.network.world.registerDisposer(() => {
    clickSub.unsubscribe();
  });

  const runSystems = () => runMainSystems(sceneApi, game, core);
  return { ...sceneApi, runSystems };
};
