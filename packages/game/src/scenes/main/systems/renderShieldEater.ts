import { Core } from '@primodiumxyz/core';
import { Entity, namespaceWorld } from '@primodiumxyz/reactive-tables';
import { PrimodiumScene } from '@game/types';

export const renderShieldEater = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, 'systems');

  tables.ShieldEater.watch({
    world: systemsWorld,
    onChange: ({ properties: { current, prev } }) => {
      if (prev) {
        console.log('prev', prev);
        scene.objects.planet
          .get(prev.destinationPlanet as Entity)
          ?.setShieldEaterDestination(0);
        scene.objects.planet
          .get(prev.currentPlanet as Entity)
          ?.setShieldEaterLocation(false);
      }

      if (current) {
        console.log('current', current);
        const destPlanet = current.destinationPlanet as Entity;
        const currPlanet = current.currentPlanet as Entity;

        // TODO: get amount of planets between currPlanet and destPlanet to figure out how many turns for destination
        scene.objects.planet.get(destPlanet)?.setShieldEaterDestination(1);
        scene.objects.planet.get(currPlanet)?.setShieldEaterLocation(true);
      }
    },
  });
};
