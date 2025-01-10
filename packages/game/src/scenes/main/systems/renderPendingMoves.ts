import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { StaggerQueue } from "@game/lib/utils/createStaggerQueue";
import { PrimodiumScene } from "@game/types";

export const renderPendingMoves = (scene: PrimodiumScene, core: Core, { enqueue }: StaggerQueue) => {
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

      const visible = !!scene.tables.GameState.get()?.visible;
      enqueue(() => {
        planet.setPendingMove(current.destinationPlanetId as Entity, visible);
      }, 100);
    },
    onUpdate: ({ entity, properties: { current } }) => {
      if (!current) return;

      const planet = scene.objects.planet.get(entity);

      if (!planet) return;

      const visible = !!scene.tables.GameState.get()?.visible;
      enqueue(() => {
        planet.setPendingMove(current.destinationPlanetId as Entity, visible);
      }, 100);
    },
    onExit: ({ entity }) => {
      const planet = scene.objects.planet.get(entity);
      if (!planet) return;
      planet.removePendingMove();
    },
  });
};
