import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";
import { renderPlanets } from "@game/scenes/main/systems/renderPlanets";
import { renderPendingMoves } from "@game/scenes/main/systems/renderPendingMoves";
import { renderRoutines } from "@game/scenes/main/systems/renderRoutines";
import { renderOverrides } from "@game/scenes/main/systems/renderOverrides";

export const runSystems = (
  scene: PrimodiumScene,
  game: GlobalApi,
  core: Core
) => {
  renderPlanets(scene, core);
  renderPendingMoves(scene, core);
  renderRoutines(scene, core);
  renderOverrides(scene, core);
};
