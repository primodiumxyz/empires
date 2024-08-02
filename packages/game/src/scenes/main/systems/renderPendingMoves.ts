import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";

export const renderPendingMoves = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.PendingMove.watch({
    world: systemsWorld,
    onEnter: ({ entity, properties: { current } }) => {
      if (!current) return;

      const planet = scene.objects.planet.get(entity);

      if (!planet) return;

      planet.setPendingMove(current.destinationPlanetId as Entity);
    },
    onUpdate: ({ entity, properties: { current } }) => {
      if (!current) return;

      const planet = scene.objects.planet.get(entity);

      if (!planet) return;

      planet.setPendingMove(current.destinationPlanetId as Entity);
    },
    onExit: ({ entity }) => {
      const planet = scene.objects.planet.get(entity);
      if (!planet) return;
      planet.removePendingMove();
    },
  });
};
