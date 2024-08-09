import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { renderChargeProgress } from "@game/scenes/main/systems/renderChargeProgress";
import { renderMagnets } from "@game/scenes/main/systems/renderMagnets";
import { renderOverrideFloatingText } from "@game/scenes/main/systems/renderOverrideFloatingText";
import { renderPendingMoves } from "@game/scenes/main/systems/renderPendingMoves";
import { renderPlanets } from "@game/scenes/main/systems/renderPlanets";
import { renderRoutines } from "@game/scenes/main/systems/renderRoutines";
import { renderShieldEater } from "@game/scenes/main/systems/renderShieldEater";
import { PrimodiumScene } from "@game/types";

export const runSystems = (scene: PrimodiumScene, game: GlobalApi, core: Core) => {
  renderPlanets(scene, core);
  renderPendingMoves(scene, core);
  renderRoutines(scene, core);
  renderOverrideFloatingText(scene, core);
  renderChargeProgress(scene, core);
  renderMagnets(scene, core);
  renderShieldEater(scene, core);
};
