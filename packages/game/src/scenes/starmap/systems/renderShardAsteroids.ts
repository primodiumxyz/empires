import { Core } from "@primodiumxyz/core";
import { Coord } from "@primodiumxyz/engine/types";
import { $query, Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { renderShardAsteroid } from "@game/lib/render/renderShardAsteroid";
import { ShardAsteroid } from "@game/lib/objects/asteroid/ShardAsteroid";

export const renderShardAsteroids = (scene: PrimodiumScene, core: Core) => {
  const {
    network: { world },
    tables,
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  const renderExplodeAndMoveAsteroid = (entity: Entity, coord: Coord) => {
    const asteroid = scene.objects.asteroid.get(entity) as ShardAsteroid;
    asteroid.explode(coord);
  };

  $query(
    {
      with: [tables.ShardAsteroid, tables.Position],
    },
    {
      world: systemsWorld,
      onEnter: ({ entity }) => {
        const coord = tables.Position.get(entity);
        if (!coord) return;

        renderShardAsteroid({ scene, entity, coord, tables, addEventHandlers: true });
      },
      onUpdate: ({ entity, table }) => {
        if (table.id === tables.Position.id) return;
        const coord = tables.Position.get(entity);

        if (!coord) return;

        renderExplodeAndMoveAsteroid(entity, coord);
      },
    }
  );
};
