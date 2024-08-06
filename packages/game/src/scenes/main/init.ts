// ROOT ENTRY POINT
import { Assets, Sprites } from "@primodiumxyz/assets";
import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { mainSceneConfig } from "@game/lib/config/mainScene";
import { isDragging } from "@game/lib/utils/inputGuards";
import { setupBasicCameraMovement } from "@game/scenes/common/setup/setupBasicCameraMovement";
import { runSystems as runMainSystems } from "@game/scenes/main/systems";
import { PrimodiumScene } from "@game/types";

export const initMainScene = async (game: GlobalApi, core: Core): Promise<PrimodiumScene> => {
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
      Sprites.StarBg,
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

  const cameraMovement = setupBasicCameraMovement(sceneApi, core.network.world, {
    doubleClickZoom: false,
    zoomKeybind: false,
  });

  //LOCK CAMERA WHEN SELECTING A PLANET
  tables.SelectedPlanet.watch({
    onChange: async ({ properties: { current } }) => {
      if (current?.value) {
        const planet = sceneApi.objects.planet.get(current.value);
        if (planet) {
          cameraMovement.pause();
          await sceneApi.camera.focusCamera(planet.coord);
        }
        return;
      } else {
        await sceneApi.camera.unfocusCamera();
      }
      cameraMovement.resume();
    },
  });

  const clickSub = scene.input.click$.subscribe(([, objects]) => {
    if (objects.length !== 0) return;
    tables.HoveredPlanet.remove();
    tables.SelectedPlanet.remove();
  });

  //while dragging and having a selected planet, remove the planet from the selection
  const pointerMoveSub = scene.input.pointermove$.subscribe((pointer) => {
    if (isDragging(pointer) && tables.SelectedPlanet.get()?.value) {
      tables.SelectedPlanet.remove();
    }
  });
  //same for wheel
  const wheelSub = scene.phaserScene.input.on(
    "wheel",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (deltaY && tables.SelectedPlanet.get()?.value) {
        tables.SelectedPlanet.remove();
      }
    },
  );

  core.network.world.registerDisposer(() => {
    clickSub.unsubscribe();
    pointerMoveSub.unsubscribe();
    wheelSub.destroy();
  });

  const runSystems = () => runMainSystems(sceneApi, game, core);
  return { ...sceneApi, runSystems };
};
