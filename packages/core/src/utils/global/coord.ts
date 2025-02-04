import { EDirection } from "@primodiumxyz/contracts";
import { AxialCoord, CartesionCoord } from "@core/lib";

/**
 * Converts axial coords to cartesian assuming pointy top hexagon.
 *
 * @param {AxialCoord} axialCoord - Q and R coords in axial coordinate system.
 * @param {number} size - Size of hexagonal tile.
 * @returns {CartesionCoord} Cartesian Coordinates x and y.
 */
export function convertAxialToCartesian(axialCoord: AxialCoord, size: number): CartesionCoord {
  const { q, r } = axialCoord;

  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);

  return { x, y };
}

export function getNeighbor(q: bigint | number, r: bigint | number, direction: EDirection): AxialCoord {
  q = Number(q);
  r = Number(r);

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

export const directions: EDirection[] = [
  EDirection.East,
  EDirection.Southeast,
  EDirection.Southwest,
  EDirection.West,
  EDirection.Northwest,
  EDirection.Northeast,
];

export function hexDistance(a: { q: number; r: number }, b: { q: number; r: number }): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function getDirection(
  from: { q: bigint | number; r: bigint | number },
  to: { q: bigint | number; r: bigint | number },
): EDirection {
  const fromQ = Number(from.q);
  const fromR = Number(from.r);
  const toQ = Number(to.q);
  const toR = Number(to.r);

  const angle = Math.atan2(toR - fromR, toQ - fromQ);
  const sector = Math.floor((angle / (Math.PI / 3) + 6) % 6);
  return directions[sector] || EDirection.East;
}
