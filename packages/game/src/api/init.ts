import { Core } from "@primodiumxyz/core";
import { engine } from "@primodiumxyz/engine";
import type { ContractCalls } from "@client/contractCalls/createContractCalls";
import { createGlobalApi, GlobalApi } from "@game/api/global";
import gameConfig from "@game/lib/config/game";
import { SceneKeys } from "@game/lib/constants/common";
import { initMainScene } from "@game/scenes/main/init";
import { initRootScene } from "@game/scenes/root/init";
import { initUIScene } from "@game/scenes/ui/init";
import { PrimodiumScene } from "@game/types";

export type InitResult = Promise<
  Record<SceneKeys, PrimodiumScene> & {
    GLOBAL: GlobalApi;
  }
>;
async function init(core: Core, calls: ContractCalls): InitResult {
  const game = await engine.createGame(gameConfig);
  const globalApi = createGlobalApi(game, core);

  return {
    ROOT: await initRootScene(globalApi, core, game.phaserGame),
    UI: await initUIScene(globalApi, core),
    GLOBAL: globalApi,
    MAIN: await initMainScene(globalApi, core),
  };
}

export default init;
