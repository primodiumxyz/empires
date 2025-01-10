import { ChunkCoord, PixelCoord, Scene, TileCoord } from "@primodiumxyz/engine";
import * as Coord from "@primodiumxyz/engine/src/lib/util/coords";

export const createUtilApi = (scene: Scene) => {
  function pixelCoordToTileCoord(coord: PixelCoord): TileCoord {
    return Coord.pixelCoordToTileCoord(coord, scene.tiled.tileWidth, scene.tiled.tileHeight);
  }

  function tileCoordToPixelCoord(coord: TileCoord): PixelCoord {
    return Coord.tileCoordToPixelCoord(coord, scene.config.tilemap.tileWidth, scene.config.tilemap.tileHeight);
  }

  function pixelCoordToChunkCoord(coord: PixelCoord): ChunkCoord {
    return Coord.pixelToChunkCoord(coord, scene.config.cullingChunkSize);
  }

  function tileCoordToChunkCoord(coord: TileCoord): ChunkCoord {
    return Coord.tileCoordToChunkCoord(
      coord,
      scene.config.tilemap.tileWidth,
      scene.config.tilemap.tileHeight,
      scene.config.cullingChunkSize,
    );
  }

  function chunkCoordToPixelCoord(coord: ChunkCoord): PixelCoord {
    return Coord.chunkToPixelCoord(coord, scene.config.cullingChunkSize);
  }

  function chunkCoordToTileCoord(coord: ChunkCoord): TileCoord {
    return Coord.chunkCoordToTileCoord(
      coord,
      scene.config.tilemap.tileWidth,
      scene.config.tilemap.tileHeight,
      scene.config.cullingChunkSize,
    );
  }

  function getVisibleChunks() {
    return scene.objects.getVisibleChunks();
  }

  function encodeKeyForChunk(coord: ChunkCoord) {
    return scene.objects.encodeKeyForChunk(coord);
  }

  function decodeKeyFromChunk(key: string) {
    return scene.objects.decodeKeyFromChunk(key);
  }

  function getRandomRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  return {
    pixelCoordToTileCoord,
    tileCoordToPixelCoord,
    pixelCoordToChunkCoord,
    tileCoordToChunkCoord,
    chunkCoordToPixelCoord,
    chunkCoordToTileCoord,
    getVisibleChunks,
    encodeKeyForChunk,
    decodeKeyFromChunk,
    addCoords: Coord.addCoords,
    coordEq: Coord.coordEq,
    getRandomRange,
  };
};
