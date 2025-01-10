import { Core } from "@primodiumxyz/core";
import { namespaceWorld } from "@primodiumxyz/reactive-tables";
import { ContractCalls } from "@client/contractCalls/createContractCalls";
import init from "@game/api/init";
import { Scenes } from "@game/lib/constants/common";

export async function initGame(core: Core, calls: ContractCalls, version = "v1") {
  const {
    network: { world },
  } = core;

  const asciiArt = `

  ██████╗ ██████╗ ██╗███╗   ███╗ ██████╗ ██████╗ ██╗██╗   ██╗███╗   ███╗
  ██╔══██╗██╔══██╗██║████╗ ████║██╔═══██╗██╔══██╗██║██║   ██║████╗ ████║
  ██████╔╝██████╔╝██║██╔████╔██║██║   ██║██║  ██║██║██║   ██║██╔████╔██║
  ██╔═══╝ ██╔══██╗██║██║╚██╔╝██║██║   ██║██║  ██║██║██║   ██║██║╚██╔╝██║
  ██║     ██║  ██║██║██║ ╚═╝ ██║╚██████╔╝██████╔╝██║╚██████╔╝██║ ╚═╝ ██║
  ╚═╝     ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ ╚═╝     ╚═╝

                                                                          `;

  console.log("%c" + asciiArt, "color: white; background-color: brown;");

  console.log(`%cPrimodium ${version}`, "color: white; background-color: black;", "https://twitter.com/primodiumgame");

  namespaceWorld(world, "game");

  const api = await init(core, calls);

  async function destroy() {
    await api.GLOBAL.dispose();

    //dispose game logic
    world.dispose("game");
    world.dispose("systems");
  }

  function runSystems() {
    console.info("[Game] Running systems");

    Object.values(Scenes).forEach((key) => {
      api[key].runSystems?.();
    });
  }

  return { ...api, destroy, runSystems };
}
