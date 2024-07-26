import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";
import { renderPlanets } from "@game/scenes/main/systems/renderPlanets";
import { renderPendingMoves } from "@game/scenes/main/systems/renderPendingMoves";

export const runSystems = (
  scene: PrimodiumScene,
  game: GlobalApi,
  core: Core
) => {
  renderPlanets(scene, core);
  renderPendingMoves(scene, core);
};
