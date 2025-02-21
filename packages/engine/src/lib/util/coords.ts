import { Area, ChunkCoord, Coord, PixelCoord, TileCoord, WorldCoord } from "@engine/lib/types";

export const ZERO_VECTOR: Coord = { x: 0, y: 0 };

export function isTileInArea(tileCoord: TileCoord, area: Area) {
  return (
    tileCoord.x >= area.x &&
    tileCoord.x < area.x + area.width &&
    tileCoord.y >= area.x &&
    tileCoord.y < area.y + area.height
  );
}

export function coordEq(a?: Coord, b?: Coord) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y;
}

export function addCoords(a: Coord, b: Coord) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function pixelToChunkCoord(pixelCoord: PixelCoord, chunkSize: number): ChunkCoord {
  return {
    x: Math.floor(pixelCoord.x / chunkSize),
    y: Math.floor(pixelCoord.y / chunkSize),
  };
}

export function chunkToPixelCoord(chunkCoord: ChunkCoord, chunkSize: number): PixelCoord {
  return { x: chunkCoord.x * chunkSize, y: chunkCoord.y * chunkSize };
}

export function pixelCoordToTileCoord(pixelCoord: PixelCoord, tileWidth: number, tileHeight: number): TileCoord {
  return {
    x: Math.floor(pixelCoord.x / tileWidth),
    y: Math.floor(pixelCoord.y / tileHeight),
  };
}

export function tileCoordToPixelCoord(tileCoord: WorldCoord, tileWidth: number, tileHeight: number): PixelCoord {
  return {
    x: tileCoord.x * tileWidth,
    y: tileCoord.y * tileHeight,
  };
}

export function tileCoordToChunkCoord(
  tileCoord: WorldCoord,
  tileWidth: number,
  tileHeight: number,
  chunkSize: number,
): ChunkCoord {
  const pixelCoord = tileCoordToPixelCoord(tileCoord, tileWidth, tileHeight);
  return pixelToChunkCoord(pixelCoord, chunkSize);
}

export function chunkCoordToTileCoord(
  chunkCoord: ChunkCoord,
  tileWidth: number,
  tileHeight: number,
  chunkSize: number,
): WorldCoord {
  const pixelCoord = chunkToPixelCoord(chunkCoord, chunkSize);
  return pixelCoordToTileCoord(pixelCoord, tileWidth, tileHeight);
}
