// STAR MAP ENTRY POINT
import { Core } from "@primodiumxyz/core";

import { starmapSceneConfig } from "@game/lib/config/starmapScene";
import { createSceneApi } from "@game/api/scene";
import { setupBasicCameraMovement } from "@game/scenes/common/setup/setupBasicCameraMovement";
import { GlobalApi } from "@game/api/global";
import { runSystems as runStarmapSystems } from "@game/scenes/starmap/systems";
import { PrimodiumScene } from "@game/types";

export const initStarmapScene = async (game: GlobalApi, core: Core): Promise<PrimodiumScene> => {
  const {
    tables,
    network: { world },
  } = core;

  const scene = await game.createScene(starmapSceneConfig, false);
  const sceneApi = createSceneApi(scene);
  sceneApi.audio.setPauseOnBlur(false);

  setupBasicCameraMovement(sceneApi, world, {
    translateKeybind: true,
    doubleClickZoom: false,
  });

  const clickSub = scene.input.click$.subscribe(([pointer, objects]) => {
    //if we have more than one object, we want to emit the pointerdown and pointerup events on all of them except the first one
    if (objects.length > 1) {
      objects.slice(1).forEach((obj) => {
        obj.emit("pointerdown", pointer);
        obj.emit("pointerup", pointer);
      });
      return;
    }

    if (objects.length !== 0) return;
    tables.SelectedRock.remove();
    tables.SelectedFleet.remove();
  });

  world.registerDisposer(() => {
    clickSub.unsubscribe();
  }, "game");

  const runSystems = () => runStarmapSystems(sceneApi, core);

  return { ...sceneApi, runSystems };
};
