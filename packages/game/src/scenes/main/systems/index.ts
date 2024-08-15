import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { renderMagnets } from "@game/scenes/main/systems/renderMagnets";
import { renderOverrideFloatingText } from "@game/scenes/main/systems/renderOverrideFloatingText";
import { renderPendingMoves } from "@game/scenes/main/systems/renderPendingMoves";
import { renderPlanets } from "@game/scenes/main/systems/renderPlanets";
import { renderRoutines } from "@game/scenes/main/systems/renderRoutines";
import { PrimodiumScene } from "@game/types";

export const runSystems = (scene: PrimodiumScene, game: GlobalApi, core: Core) => {
  renderPlanets(scene, core);
  renderPendingMoves(scene, core, game.queue);
  renderRoutines(scene, core, game.queue);
  renderOverrideFloatingText(scene, core, game.queue);
  // renderOverheat(scene, core);
  renderMagnets(scene, core);
};
