// import { engine } from "@primodiumxyz/engine";
import { Core } from "@primodiumxyz/core";
import type { ContractCalls } from "@client/contractCalls/createContractCalls";

import { /* createGlobalApi, */ GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";
import { SceneKeys } from "@game/lib/constants/common";
import { KeybindActionKeys } from "@game/lib/constants/keybinds";
import { engine } from "@primodiumxyz/engine";
import gameConfig from "@game/lib/config/game";
// import { initRootScene } from "@game/scenes/root/init";

export type InitResult = Promise<
  Record<SceneKeys, PrimodiumScene> & { GLOBAL: GlobalApi }
>;
async function init(core: Core, calls: ContractCalls): InitResult {
  const game = await engine.createGame(gameConfig);
  // const globalApi = createGlobalApi(game);

  return {
    UI: {
      audio: {
        play: () => {},
      },
      input: {
        addListener: (
          keybindAction: KeybindActionKeys,
          callback: () => void,
          emitOnRepeat = false,
          wait = 0
        ) => {
          return () => {};
        },
      },
    },
    GLOBAL: {
      disableGlobalInput: () => {},
      enableGlobalInput: () => {},
      dispose: () => {},
    },
  };
}

export default init;
