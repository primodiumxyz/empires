import { GameObjectClasses } from "./util/constants";
import { createGame } from "@engine/lib/core/createGame";
import { createScene } from "@engine/lib/core/createScene";

export type Game = Awaited<ReturnType<typeof createGame>>;
export type Scene = Awaited<ReturnType<typeof createScene>>;

export type CameraConfig = {
  pinchSpeed: number;
  wheelSpeed: number;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
};

export type PackConfig = {
  image?: Array<{
    key: string;
    url: string;
  }>;
  audioSprite?: Array<{
    key: string;
    urls: string[];
    jsonURL: string;
  }>;
  atlas?: Array<{
    key: string;
    textureURL: string;
    atlasURL: string;
  }>;
  tilemapTiledJSON?: Array<{
    key: string;
    url: string;
  }>;
  bitmapFont?: Array<{
    key: string;
    textureURL: string;
    fontDataURL: string;
  }>;
};

export type Key =
  | keyof typeof Phaser.Input.Keyboard.KeyCodes
  | "POINTER_LEFT"
  | "POINTER_RIGHT";

export type GameConfig = Phaser.Types.Core.GameConfig & {
  key: string;
  assetPack: PackConfig;
};

export type LayerConfig = Record<string, { depth: number }>;
export type TilemapConfig = Record<string, LayerConfig>;

export type Animation = {
  key: string;
  assetKey: string;
  startFrame: number;
  endFrame: number;
  frameRate: number;
  // Number of times to repeat the animation, -1 for infinity
  repeat?: number;
  prefix?: string;
  suffix?: string;
};

export interface SceneConfig {
  key: string;
  camera: CameraConfig;
  animations?: Animation[];
  cullingChunkSize: number;
  tilemap: {
    tileWidth: number;
    tileHeight: number;
    defaultKey?: string;
    config?: TilemapConfig;
  };
}

export interface TileAnimation {
  key: string;
  frames: number[];
}

export type GameObjectTypes = typeof GameObjectClasses;
export type GameObject<Type extends keyof GameObjectTypes> = InstanceType<
  GameObjectTypes[Type]
>;

/**
 * @id: Unique id of the component to handle updating the same component
 * @now: Use for things like visual effects that are only relevant in this moment
 * @once: Use for setting parameters that should be set when initializing
 * @update: Use for adding update functions that are called at every game tick
 */
export type GameObjectComponent<Type extends keyof GameObjectTypes> = {
  id: string;
  modifiesPosition?: boolean;
  now?: GameObjectFunction<Type>;
  once?: GameObjectFunction<Type>;
  update?: GameObjectFunction<Type>;
  exit?: GameObjectFunction<Type>;
};

export type GameObjectFunction<Type extends keyof GameObjectTypes> = (
  gameObject: GameObject<Type>,
  time: number,
  delta: number
) => Promise<void> | void;

export type Area = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Coord = {
  x: number;
  y: number;
};

export type PixelCoord = Coord;
export type TileCoord = Coord;
export type ChunkCoord = Coord;
export type WorldCoord = Coord;
