import { convertAxialToCartesian, Core } from "@primodiumxyz/core";

import { Planet } from "@game/lib/objects/Planet";
import { PrimodiumScene } from "@game/types";

const MARGIN = 10;

export const renderPlanets = (scene: PrimodiumScene, core: Core) => {
  const { tables } = core;

  tables.Planet.getAll().forEach((entity) => {
    const planet = tables.Planet.get(entity);
    if (!planet) return;

    const { q, r } = planet;
    new Planet({
      id: entity,
      scene,
      coord: convertAxialToCartesian(
        { q: Number(q) - 100, r: Number(r) },
        100 + MARGIN
      ),
      empire: planet.empireId,
    });
  });
};
