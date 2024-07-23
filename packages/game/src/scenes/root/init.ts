// ROOT ENTRY POINT
import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { PrimodiumScene } from "@game/types";
import { rootSceneConfig } from "@game/lib/config/rootScene";
import { runSystems as runRootSystems } from "@game/scenes/root/systems";

export const initRootScene = async (
  game: GlobalApi,
  core: Core
): Promise<PrimodiumScene> => {
  const scene = await game.createScene(rootSceneConfig, true);

  const sceneApi = createSceneApi(scene, core);
  sceneApi.audio.setPauseOnBlur(false);

  const runSystems = () => runRootSystems(sceneApi, game, core);
  return { ...sceneApi, runSystems };
};
