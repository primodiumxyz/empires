// UI MAP ENTRY POINT
import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { createSceneApi } from "@game/api/scene";
import { uiSceneConfig } from "@game/lib/config/uiScene";
import { runSystems as runUISystems } from "@game/scenes/ui/systems";
import { PrimodiumScene } from "@game/types";

export const initUIScene = async (game: GlobalApi, core: Core): Promise<PrimodiumScene> => {
  const scene = await game.createScene(uiSceneConfig, true);
  const sceneApi = createSceneApi(scene, game);
  sceneApi.audio.setPauseOnBlur(false);

  const runSystems = () => runUISystems(sceneApi, core);
  return { ...sceneApi, runSystems };
};
