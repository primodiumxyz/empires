import { AxialCoord, CartesionCoord } from "@core/lib";

export function convertAxialToCartesian(axialCoord: AxialCoord, size: number): CartesionCoord {
  const { q, r } = axialCoord;

  const x = size * (3 / 2) * q;
  const y = size * Math.sqrt(3) * (r + q / 2);

  return { x, y };
}
