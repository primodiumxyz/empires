import { namespaceWorld } from "@primodiumxyz/reactive-tables";
import { Core, SyncSourceType } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const setupSync = (core: Core) => {
  const {
    network: { world },
    tables,
    sync: { syncAsteroidData, syncActiveAsteroid, syncFleetData },
  } = core;

  const systemWorld = namespaceWorld(world, "coreSystems");

  // only run sync systems if we are using the indexer
  if (tables.SyncSource.get()?.value !== SyncSourceType.Indexer) return;

  tables.SelectedRock.watch({
    world: systemWorld,
    onChange: ({ properties }) => {
      const spaceRock = properties.current?.value;
      if (!spaceRock || properties.current?.value === properties.prev?.value) return;

      syncAsteroidData(spaceRock);
    },
  });

  tables.ActiveRock.watch({
    world: systemWorld,
    onChange: ({ properties }) => {
      const spaceRock = properties.current?.value;
      if (!spaceRock || properties.current?.value === properties.prev?.value) return;

      syncActiveAsteroid(spaceRock);
    },
  });

  tables.SelectedFleet.watch({
    world: systemWorld,
    onChange: ({ properties }) => {
      const fleet = properties.current?.value;
      if (!fleet || properties.current?.value === properties.prev?.value) return;

      syncFleetData(fleet);
    },
  });

  tables.HoverEntity.watch({
    world: systemWorld,
    onChange: debounce(({ properties }) => {
      const hoverEntity = properties.current?.value;
      if (!hoverEntity || properties.current?.value === properties.prev?.value) return;

      switch (true) {
        case tables.Asteroid.has(hoverEntity):
          //sync asteroid info
          syncAsteroidData(hoverEntity);
          break;
        case tables.ShardAsteroid.has(hoverEntity):
          //sync shardasteroid info
          syncAsteroidData(hoverEntity, true); // shard = true
          break;
        case tables.FleetMovement.has(hoverEntity):
          //sync fleet info
          syncFleetData(hoverEntity);
          break;
        default:
          break;
      }
    }, 250),
  });
};
