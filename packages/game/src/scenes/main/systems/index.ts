import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { renderAcidRain } from "@game/scenes/main/systems/renderAcidRain";
import { renderGameState } from "@game/scenes/main/systems/renderGameState";
import { renderMagnets } from "@game/scenes/main/systems/renderMagnets";
import { renderOverrideFloatingText } from "@game/scenes/main/systems/renderOverrideFloatingText";
import { renderPendingMoves } from "@game/scenes/main/systems/renderPendingMoves";
import { renderPlanets } from "@game/scenes/main/systems/renderPlanets";
import { renderRoutines } from "@game/scenes/main/systems/renderRoutines";
import { renderShieldEater } from "@game/scenes/main/systems/renderShieldEater";
import { PrimodiumScene } from "@game/types";

export const runSystems = (scene: PrimodiumScene, game: GlobalApi, core: Core) => {
  renderGameState(scene, core, game);
  renderPlanets(scene, core);
  renderPendingMoves(scene, core, game.queue);
  renderRoutines(scene, core, game.queue);
  renderOverrideFloatingText(scene, core, game.queue);
  renderMagnets(scene, core);
  renderShieldEater(scene, core);
  renderAcidRain(scene, core);
};
