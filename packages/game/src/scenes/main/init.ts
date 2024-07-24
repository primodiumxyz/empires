// ROOT ENTRY POINT
import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { PrimodiumScene } from "@game/types";
import { runSystems as runMainSystems } from "@game/scenes/main/systems";
import { mainSceneConfig } from "@game/lib/config/mainScene";

export const initMainScene = async (
  game: GlobalApi,
  core: Core
): Promise<PrimodiumScene> => {
  const scene = await game.createScene(mainSceneConfig, true);

  const sceneApi = createSceneApi(scene, game);
  sceneApi.audio.setPauseOnBlur(false);

  scene.camera.phaserCamera.centerOn(0, 0);

  const runSystems = () => runMainSystems(sceneApi, game, core);
  return { ...sceneApi, runSystems };
};
