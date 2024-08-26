import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { setupGameStateManager } from "@game/scenes/root/systems/setupGameStateManager";
import { PrimodiumScene } from "@game/types";

export const runSystems = (scene: PrimodiumScene, game: GlobalApi, core: Core, phaserGame: Phaser.Game) => {
  setupGameStateManager(game, phaserGame);
};
