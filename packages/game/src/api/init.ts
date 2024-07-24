import { Core } from "@primodiumxyz/core";
import type { ContractCalls } from "@client/contractCalls/createContractCalls";

import { createGlobalApi, GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";
import { SceneKeys } from "@game/lib/constants/common";
import { engine } from "@primodiumxyz/engine";
import gameConfig from "@game/lib/config/game";
import { initRootScene } from "@game/scenes/root/init";
import { initUIScene } from "@game/scenes/ui/init";

export type InitResult = Promise<
  Record<SceneKeys, PrimodiumScene> & {
    GLOBAL: GlobalApi;
  }
>;
async function init(core: Core, calls: ContractCalls): InitResult {
  const game = await engine.createGame(gameConfig);
  const globalApi = createGlobalApi(game, core);

  return {
    ROOT: await initRootScene(globalApi, core),
    UI: await initUIScene(globalApi, core),
    GLOBAL: globalApi,
  };
}

export default init;
