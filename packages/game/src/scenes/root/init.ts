// ROOT ENTRY POINT
import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { rootSceneConfig } from "@game/lib/config/rootScene";
import { runSystems as runRootSystems } from "@game/scenes/root/systems";
import { PrimodiumScene } from "@game/types";

export const initRootScene = async (game: GlobalApi, core: Core): Promise<PrimodiumScene> => {
  const scene = await game.createScene(rootSceneConfig, true);

  const sceneApi = createSceneApi(scene, game);
  sceneApi.audio.setPauseOnBlur(false);

  scene.camera.phaserCamera.centerOn(0, 0);

  const runSystems = () => runRootSystems(sceneApi, game, core);
  return { ...sceneApi, runSystems };
};
