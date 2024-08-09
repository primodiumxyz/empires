import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

export const renderShieldEater = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
    utils: { getAllNeighbors, getShieldEaterPath },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  // Update current planet, path and destination
  tables.ShieldEater.watch({
    world: systemsWorld,
    onChange: ({ properties: { current, prev } }) => {
      // remove previous labels
      if (prev) {
        scene.objects.planet.get(prev.destinationPlanet as Entity)?.setShieldEaterDestination(0);
        scene.objects.planet.get(prev.currentPlanet as Entity)?.setShieldEaterLocation(false);
      }

      // add new labels
      if (current) {
        const destPlanet = current.destinationPlanet as Entity;
        const currPlanet = current.currentPlanet as Entity;

        const path = getShieldEaterPath(currPlanet, destPlanet);
        const turnsToDestination = path.length + 1;

        // add current & destination labels
        scene.objects.planet.get(destPlanet)?.setShieldEaterDestination(turnsToDestination);
        scene.objects.planet.get(currPlanet)?.setShieldEaterLocation(true);

        // add path labels with turns to arrival
        path.forEach((planet, index) => {
          scene.objects.planet.get(planet)?.setShieldEaterPath(index + 1);
        });
      }
    },
  });

  // Animate when detonating
  tables.ShieldEaterDetonateOverrideLog.watch(
    {
      world: systemsWorld,
      onChange: ({ properties: { current } }) => {
        if (!current) return;

        const planetEntity = current.planetId as Entity;
        const neighborPlanetEntities = getAllNeighbors(planetEntity);
        const planet = scene.objects.planet.get(planetEntity);
        const neighborPlanets = neighborPlanetEntities.map((planet) => scene.objects.planet.get(planet));

        planet?.shieldEaterDetonate();
        neighborPlanets.forEach((planet) => planet?.shieldEaterCrack());
      },
    },
    { runOnInit: false },
  );
};
