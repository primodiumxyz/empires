import { convertAxialToCartesian, Core } from "@primodiumxyz/core";
import { namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { Planet } from "@game/lib/objects/planet";

export const renderPlanets = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.Planet.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current } }) => {
      if (!current) return;

      const { q, r } = current;

      new Planet({
        id: entity,
        scene,
        coord: convertAxialToCartesian({ q: Number(q), r: Number(r) }, 100),
      });
    },
  });
};
