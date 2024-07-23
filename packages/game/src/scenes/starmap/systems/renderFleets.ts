import { Core, EntityType } from "@primodiumxyz/core";
import { defaultEntity, Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { EFleetStance } from "contracts/config/enums";

import { TransitLine } from "@game/lib/objects/TransitLine";
import { renderFleet } from "@game/lib/render/renderFleet";
import { DeferredAsteroidsRenderContainer } from "@game/lib/objects/asteroid/DeferredAsteroidsRenderContainer";
import { StanceToIcon } from "@game/lib/mappings";
import { PrimodiumScene } from "@game/types";

export const renderFleets = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
    utils,
  } = core;

  const systemsWorld = namespaceWorld(world, "systems");
  const deferredRenderContainer = scene.objects.deferredRenderContainer.getContainer(
    EntityType.Asteroid
  ) as DeferredAsteroidsRenderContainer;
  const transitsToUpdate = new Set<Entity>();
  const { objects } = scene;

  // handle rendering fleets if asteroid is not yet spawned
  const spawnQueue = new Map<Entity, Entity[]>();
  const unsub = scene.objects.asteroid.onNewObject((id) => {
    const asteroidEntity = id as Entity;
    // does fleets exist in spawn queue
    const fleets = spawnQueue.get(asteroidEntity);

    if (fleets) {
      fleets.forEach((entity) => {
        handleFleetOrbit(entity, asteroidEntity);
      });
      spawnQueue.delete(asteroidEntity);
    }
  });

  systemsWorld.registerDisposer(unsub);

  function handleFleetTransit(fleet: Entity, origin: Entity, destination: Entity) {
    const originPosition = tables.Position.get(origin) ?? { x: 0, y: 0 };
    const destinationPosition = tables.Position.get(destination) ?? { x: 0, y: 0 };
    const originPixelPosition = scene.utils.tileCoordToPixelCoord({ x: originPosition.x, y: -originPosition.y });
    const destinationPixelPosition = scene.utils.tileCoordToPixelCoord({
      x: destinationPosition.x,
      y: -destinationPosition.y,
    });

    const fleetObject = getFleetObject(fleet);

    const transitLine = getTransitLineObject(fleet);
    transitLine.setFleet(fleetObject);
    transitLine.setCoordinates(originPixelPosition, destinationPixelPosition);
    transitsToUpdate.add(fleet);

    //update the view of the container when fleet moves away from origin. This can mean removing the orbit ring render or updating the inline layout
    const originAsteroid = scene.objects.asteroid.get(origin as Entity);
    originAsteroid?.getFleetsContainer().updateView();
  }

  function handleFleetOrbit(fleet: Entity, asteroidEntity: Entity) {
    const asteroid = scene.objects.asteroid.get(asteroidEntity);

    if (asteroid) {
      const fleetObject = getFleetObject(fleet);
      asteroid.getFleetsContainer()?.addFleet(fleetObject);
      deferredRenderContainer?.removeFleet(fleet);
    } else {
      const queue = spawnQueue.get(asteroidEntity) ?? [];
      if (queue.length) queue.push(fleet);
      else spawnQueue.set(asteroidEntity, [fleet]);
      const coord = tables.Position.get(asteroid);
      deferredRenderContainer?.addFleet(fleet, asteroidEntity, coord);
    }
  }

  function getFleetObject(entity: Entity) {
    const fleet = scene.objects.fleet.get(entity);

    if (!fleet) {
      const newFleet = renderFleet({ scene, entity, tables });
      return newFleet;
    }

    return fleet;
  }

  function getTransitLineObject(entity: Entity) {
    const transitLine = scene.objects.transitLine.get(entity);

    if (!transitLine) {
      const newTransitLine = new TransitLine({ id: entity, scene, start: { x: 0, y: 0 }, end: { x: 0, y: 0 } });
      return newTransitLine;
    }

    return transitLine;
  }

  //render fleets
  tables.FleetMovement.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current: newMovement, prev: oldMovement } }) => {
      // if this fleet was in the spawn queue for the previous asteroid, remove it
      if (oldMovement && spawnQueue.has(oldMovement.destination as Entity)) {
        const fleets = spawnQueue.get(oldMovement.destination as Entity);
        if (fleets) {
          const index = fleets.indexOf(entity);
          if (index !== -1) {
            fleets.splice(index, 1);
          }
        }
      }

      if (newMovement) {
        const time = tables.Time.get()?.value ?? 0n;
        const arrivalTime = newMovement.arrivalTime ?? 0n;
        if (arrivalTime <= time) {
          handleFleetOrbit(entity, newMovement.destination as Entity);
        } else {
          handleFleetTransit(entity, newMovement.origin as Entity, newMovement.destination as Entity);
        }
      } else if (oldMovement) {
        const transitLine = scene.objects.transitLine.get(entity);
        if (transitLine) {
          transitLine.destroy();
          transitsToUpdate.delete(entity);
        } else {
          const orbitRing = scene.objects.asteroid.get(oldMovement.destination as Entity)?.getFleetsContainer();
          const fleet = scene.objects.fleet.get(entity);
          if (fleet) orbitRing?.removeFleet(fleet);
        }
      }
    },
  });

  //handle updating fleets in transit
  tables.Time.watch({
    world: systemsWorld,
    onChange: ({ properties: { current } }) => {
      const now = current?.value ?? 0n;

      transitsToUpdate.forEach((transit) => {
        const transitObj = scene.objects.transitLine.get(transit);
        if (!transitObj) return;

        const movement = tables.FleetMovement.get(transit);
        if (!movement) return;

        const timeTraveled = now - movement.sendTime;
        const totaltime = movement.arrivalTime - movement.sendTime;

        const progress = Number(timeTraveled) / Number(totaltime);

        transitObj.setFleetProgress(progress);

        if (progress >= 1) {
          const fleet = scene.objects.fleet.get(transit);
          const orbitRing = scene.objects.asteroid.get(movement.destination as Entity)?.getFleetsContainer();

          if (orbitRing && fleet) {
            scene.objects.transitLine.get(transit)?.destroy(true);
            orbitRing.addFleet(fleet);
          }

          transitsToUpdate.delete(transit);
        }
      });
    },
  });

  //render stances
  tables.FleetStance.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current } }) => {
      const stance = current?.stance;

      const asteroid = tables.FleetMovement.get(entity)?.destination as Entity | undefined;

      const fleetObj = objects.fleet.get(entity);

      if (!fleetObj) return;

      const asteroidObj = objects.asteroid.get(asteroid ?? defaultEntity);

      if (!stance) {
        fleetObj.hideStanceIcon(true);
        if (
          asteroidObj?.getFleetsContainer().getFleetCount() === 1 ||
          !utils.isAsteroidBlocked(asteroid ?? defaultEntity)
        )
          asteroidObj?.getFleetsContainer().hideBlockRing(true);
        return;
      }

      fleetObj.setStanceIcon(StanceToIcon[stance as EFleetStance], true, true);

      if (stance === EFleetStance.Block) asteroidObj?.getFleetsContainer().showBlockRing(true);
    },
  });

  //handle fleet empty updates
  tables.IsFleetEmpty.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current } }) => {
      const fleetObj = objects.fleet.get(entity);
      const isEmpty = !!current?.value;

      if (!fleetObj) return;

      if (isEmpty) fleetObj.setAlpha(0.5);
      else fleetObj.setAlpha(1);
    },
  });
};
