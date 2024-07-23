import { Core } from "@primodiumxyz/core";
import { renderAsteroids } from "@game/scenes/starmap/systems/renderAsteroids";
import { renderFleets } from "@game/scenes/starmap/systems/renderFleets";
import { renderShardAsteroids } from "@game/scenes/starmap/systems/renderShardAsteroids";
import { renderTrajectory } from "@game/scenes/starmap/systems/renderTrajectory";
import { PrimodiumScene } from "@game/types";

export const runSystems = (scene: PrimodiumScene, core: Core) => {
  renderAsteroids(scene, core);
  renderShardAsteroids(scene, core);
  renderFleets(scene, core);
  renderTrajectory(scene, core);
};
