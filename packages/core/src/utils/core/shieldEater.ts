import { Entity, query } from "@primodiumxyz/reactive-tables";
import { AxialCoord, AxialCoordBigInt, Tables } from "@core/lib";

export function createShieldEaterUtils(tables: Tables) {
  // Mimics the behavior of LibShieldEater:update for all updates up to the destination planet
  const getShieldEaterPath = (currentPlanetEntity: Entity, destinationPlanetEntity: Entity): Entity[] => {
    const path: Entity[] = [];
    const destinationPlanet = tables.Planet.get(destinationPlanetEntity);
    let currentPlanet = tables.Planet.get(currentPlanetEntity);
    if (!currentPlanet || !destinationPlanet) return path;

    while (currentPlanetEntity !== destinationPlanetEntity) {
      const src: AxialCoordBigInt = { q: currentPlanet.q, r: currentPlanet.r };
      const dst: AxialCoordBigInt = { q: destinationPlanet.q, r: destinationPlanet.r };

      // Get the direction to move
      let offset = getTargetDirection(src, dst);
      let dirAttempts = 1;

      // If there's a hole in the map, rotate the direction
      while (!isPlanet({ q: Number(src.q) + offset.q, r: Number(src.r) + offset.r })) {
        if (dirAttempts > 6) {
          // If we've tried all directions, there is no path.
          return path;
        }
        offset = rotateTargetDirection(offset);
        dirAttempts++;
      }

      // Find the planet at the new coordinates
      const nextPlanetEntity = findPlanetByCoord({ q: Number(src.q) + offset.q, r: Number(src.r) + offset.r });
      if (!nextPlanetEntity) break; // Exit if we can't find a valid next planet

      path.push(nextPlanetEntity);
      currentPlanetEntity = nextPlanetEntity;
      currentPlanet = tables.Planet.get(currentPlanetEntity);
      if (!currentPlanet) break; // Exit if we can't get data for the next planet
    }

    return path;
  };

  function getTargetDirection(src: AxialCoordBigInt, dst: AxialCoordBigInt): { q: number; r: number } {
    const dir = { q: 0, r: 0 };
    if (dst.q > src.q) {
      dir.q = 1; // East or Northeast
      if (dst.r >= src.r) {
        dir.r = 0; // East
      } else {
        dir.r = -1; // Northeast
      }
    } else if (dst.q === src.q) {
      dir.q = 0; // Northwest or Southeast
      if (dst.r > src.r) {
        dir.r = 1; // Southeast
      } else {
        dir.r = -1; // Northwest
      }
    } else {
      dir.q = -1; //  West or Southwest
      if (dst.r > src.r) {
        dir.r = 1; // Southwest
      } else {
        dir.r = 0; // West
      }
    }
    return dir;
  }

  function rotateTargetDirection(dir: { q: number; r: number }): { q: number; r: number } {
    if (dir.q === 1) {
      return dir.r === 0 ? { q: 0, r: 1 } : { q: 1, r: 0 };
    } else if (dir.q === 0) {
      return dir.r === 1 ? { q: -1, r: 1 } : { q: 1, r: -1 };
    } else {
      return dir.r === 0 ? { q: 0, r: -1 } : { q: -1, r: 0 };
    }
  }

  function findPlanetByCoord(coord: AxialCoord): Entity | undefined {
    const planet = query({
      withProperties: [{ table: tables.Planet, properties: { q: BigInt(coord.q), r: BigInt(coord.r) } }],
    });
    if (planet.length > 0) return planet[0];
    return undefined;
  }

  const isPlanet = (coord: AxialCoord): boolean => {
    const planet = findPlanetByCoord(coord);
    return (planet && tables.Planet.get(planet)?.isPlanet) ?? false;
  };

  return {
    getShieldEaterPath,
  };
}
