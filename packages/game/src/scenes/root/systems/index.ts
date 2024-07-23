import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { modeSystem } from "@game/scenes/root/systems/modeSystem";
import { PrimodiumScene } from "@game/types";
import { setupAudioEffects } from "@game/scenes/root/systems/setupAudioEffects";

export const runSystems = (scene: PrimodiumScene, game: GlobalApi, core: Core) => {
  modeSystem(game, core);
  setupAudioEffects(scene, core);
};
