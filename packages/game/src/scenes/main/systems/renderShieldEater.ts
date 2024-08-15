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
      // remove previous location
      if (prev) scene.objects.planet.get(prev.currentPlanet as Entity)?.setShieldEaterLocation(false);

      // add new labels
      if (current) {
        const destPlanet = current.destinationPlanet as Entity;
        const currPlanet = current.currentPlanet as Entity;

        const path = getShieldEaterPath(currPlanet, destPlanet);
        const turnsToDestination = path.length;

        // add current location
        scene.objects.planet.get(currPlanet)?.setShieldEaterLocation(true);

        // add path (including destination)
        tables.Planet.getAll().forEach((planet) => {
          if (path.includes(planet))
            scene.objects.planet.get(planet)?.setShieldEaterPath(path.indexOf(planet) + 1, turnsToDestination);
          else scene.objects.planet.get(planet)?.setShieldEaterPath(0);
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
