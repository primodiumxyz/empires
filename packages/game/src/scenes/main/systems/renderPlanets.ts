import { convertAxialToCartesian, Core } from "@primodiumxyz/core";
import { namespaceWorld } from "@primodiumxyz/reactive-tables";

import { Planet } from "@game/lib/objects/planet";
import { PrimodiumScene } from "@game/types";

const MARGIN = 10;

export const renderPlanets = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

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

  tables.Planet.watch({
    world: systemsWorld,
    onUpdate: ({ entity, properties: { current, prev } }) => {
      if (!current) return;

      const planet = scene.objects.planet.get(entity);
      if (!planet) return;

      if (prev?.empireId !== current.empireId) {
        planet.updateFaction(current.empireId);
      }
    },
  });
};
