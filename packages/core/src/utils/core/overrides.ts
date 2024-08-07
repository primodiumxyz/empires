import { EDirection } from "@primodiumxyz/contracts";
import { Entity, query } from "@primodiumxyz/reactive-tables";
import { AxialCoord, AxialCoordBigInt, Tables } from "@core/lib";
import { getDirection, getNeighbor } from "@core/utils/global/coord";

export function createOverrideUtils(tables: Tables) {
  const getShieldEaterPath = (currentPlanetEntity: Entity, destinationPlanetEntity: Entity): Entity[] => {
    const path: Entity[] = [];
    const destinationPlanet = tables.Planet.get(destinationPlanetEntity);
    let currentPlanet = tables.Planet.get(currentPlanetEntity);
    if (!currentPlanet || !destinationPlanet) return path;

    while (currentPlanetEntity !== destinationPlanetEntity) {
      const src: AxialCoordBigInt = { q: currentPlanet.q, r: currentPlanet.r };
      const dst: AxialCoordBigInt = { q: destinationPlanet.q, r: destinationPlanet.r };

      // Get the direction to move
      console.log({ src, dst });
      const direction = getDirection(src, dst);
      console.log(direction);
      // Get the coordinates of the next planet
      let nextCoord = getNeighbor(src.q, src.r, direction);
      // If there's a hole in the map, rotate the direction
      if (!isPlanet(nextCoord)) {
        const rotatedDirection = rotateDirection(direction);
        nextCoord = getNeighbor(src.q, src.r, rotatedDirection);
      }

      // Find the planet at the new coordinates
      const nextPlanetEntity = findPlanetByCoord(nextCoord);
      if (!nextPlanetEntity || nextPlanetEntity === destinationPlanetEntity) break; // Exit if we can't find a valid next planet or if it's the destination

      path.push(nextPlanetEntity);
      currentPlanetEntity = nextPlanetEntity;
      currentPlanet = tables.Planet.get(currentPlanetEntity);
      if (!currentPlanet) break; // Exit if we can't get data for the next planet
    }

    return path;
  };

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

  function rotateDirection(direction: EDirection): EDirection {
    const directions = [
      EDirection.East,
      EDirection.Southeast,
      EDirection.Southwest,
      EDirection.West,
      EDirection.Northwest,
      EDirection.Northeast,
    ];
    const currentIndex = directions.indexOf(direction);
    return directions[(currentIndex + 1) % directions.length] ?? EDirection.East;
  }

  return {
    getShieldEaterPath,
  };
}
