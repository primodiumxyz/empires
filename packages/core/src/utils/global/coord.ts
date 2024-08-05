import { EDirection } from "@primodiumxyz/contracts";
import { AxialCoord, CartesionCoord } from "@core/lib";

/**
 * Converts axial coords to cartesian assuming pointy top hexagon.
 * @param {AxialCoord} axialCoord - Q and R coords in axial coordinate system.
 * @param {number} size - size of hexagonal tile.
 * @returns {CartesionCoord} Cartesian Coordinates x and y.
 */
export function convertAxialToCartesian(axialCoord: AxialCoord, size: number): CartesionCoord {
  const { q, r } = axialCoord;

  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);

  return { x, y };
}

export function getNeighbor(q: number, r: number, direction: EDirection): AxialCoord {
  if (direction == EDirection.East) {
    return { q: q + 1, r };
  } else if (direction == EDirection.Southeast) {
    return { q, r: r + 1 };
  } else if (direction == EDirection.Southwest) {
    return { q: q - 1, r: r + 1 };
  } else if (direction == EDirection.West) {
    return { q: q - 1, r };
  } else if (direction == EDirection.Northwest) {
    return { q, r: r - 1 };
  } else if (direction == EDirection.Northeast) {
    return { q: q + 1, r: r - 1 };
  } else {
    return { q, r };
  }
}

export function getDirection(fromPlanet: { q: bigint; r: bigint }, toPlanet: { q: bigint; r: bigint }): EDirection {
  const dq = Number(toPlanet.q) - Number(fromPlanet.q);
  const dr = Number(toPlanet.r) - Number(fromPlanet.r);

  if (dq === 1 && dr === 0) return EDirection.East;
  if (dq === 0 && dr === 1) return EDirection.Southeast;
  if (dq === -1 && dr === 1) return EDirection.Southwest;
  if (dq === -1 && dr === 0) return EDirection.West;
  if (dq === 0 && dr === -1) return EDirection.Northwest;
  if (dq === 1 && dr === -1) return EDirection.Northeast;

  return EDirection.East; // Default direction if not found
}
