import type Phaser from "phaser";

import { TilemapConfig } from "@engine/lib/types";

export const createTilemap = (
  scene: Phaser.Scene,
  tileWidth: number,
  tileHeight: number,
  defaultKey?: string,
  config?: TilemapConfig,
) => {
  const renderTilemap = (key: string) => {
    const mapData = scene.cache.tilemap.get(key).data as Phaser.Tilemaps.MapData;

    const map = scene.add.tilemap(key);

    const tilesets = mapData.tilesets.map((tileset) =>
      map.addTilesetImage(tileset.name, tileset.name),
    ) as Phaser.Tilemaps.Tileset[];

    (mapData.layers as Phaser.Tilemaps.LayerData[]).forEach((layer) => {
      const _layer = map.createLayer(layer.name, tilesets, -19 * tileWidth, -50 * tileWidth);
      _layer?.setPipeline("Light2D");

      const depth = config?.[key]?.[layer.name]?.depth;
      if (depth && _layer) {
        _layer.setDepth(depth);
      }
    });

    return map;
  };

  return { render: renderTilemap, tileHeight, tileWidth };
};
