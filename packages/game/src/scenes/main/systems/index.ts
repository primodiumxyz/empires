import { Core } from "@primodiumxyz/core";

import { GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";
import { renderPlanets } from "@game/scenes/main/systems/renderPlanets";

export const runSystems = (
  scene: PrimodiumScene,
  game: GlobalApi,
  core: Core
) => {
  renderPlanets(scene, core);
};
