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
