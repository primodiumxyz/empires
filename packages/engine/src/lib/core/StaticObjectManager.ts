import { CoordMap } from "@engine/lib/util/coordMap";
import { pixelToChunkCoord } from "@engine/lib/util/coords";
import { Coord } from "@engine/lib/types";
import { ChunkManager } from "./ChunkManager";
import { createCamera } from "./createCamera";

type Spawnable = {
  readonly id: string;
  spawn(): void;
  isSpawned(): boolean;
  setVisible(visible: boolean): Phaser.GameObjects.GameObject;
};
export type PrimodiumGameObject = (
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.BitmapText
  | Phaser.GameObjects.Line
  | Phaser.GameObjects.Zone
) &
  Spawnable;
export type BoundingBox = Phaser.Geom.Rectangle;

export class StaticObjectManager {
  private chunkManager;
  private coordMap = new CoordMap<PrimodiumGameObject[]>();
  private objMap = new Map<string, PrimodiumGameObject>();
  private boundingBoxes = new Map<string, BoundingBox[]>();
  private chunkSize: number;
  private count = 0;
  private onNewObjectCallbacks: ((id: string) => void)[] = [];
  private onObjectEnterChunkCallbacks: ((id: string) => void)[] = [];

  constructor(camera: ReturnType<typeof createCamera>, chunkSize: number) {
    this.chunkSize = chunkSize;
    this.chunkManager = new ChunkManager(
      camera,
      chunkSize,
      (coord) => this.onEnterChunk(coord),
      (coord) => this.onExitChunk(coord),
    );
  }

  add(id: string, object: PrimodiumGameObject, cull = false) {
    if (this.objMap.has(id)) return;
    this.objMap.set(id, object);

    if (cull) {
      // if it's a line, we'll handle after creation with bounding boxes so just set to inactive
      if (object instanceof Phaser.GameObjects.Line) {
        object.setActive(false).setVisible(false);
        return;
      }

      const chunkCoord = pixelToChunkCoord({ x: object.x, y: object.y }, this.chunkSize);

      const objects = this.coordMap.get(chunkCoord) ?? [];

      if (!objects.length) this.coordMap.set(chunkCoord, [object]);
      else objects.push(object);

      if (this.chunkManager.isVisibleChunk(chunkCoord)) {
        this.count--;
        if (!object.isSpawned()) {
          object.spawn();
        }
        object.setActive(true).setVisible(true);
        this.onObjectEnterChunkCallbacks.forEach((callback) => callback(id));
      }
    } else object.spawn();

    this.onNewObjectCallbacks.forEach((callback) => callback(id));
  }

  updateObjectPosition(id: string, coord: Coord) {
    const object = this.objMap.get(id);
    if (!object) return;

    const oldChunkCoord = pixelToChunkCoord({ x: object.x, y: object.y }, this.chunkSize);
    const newChunkCoord = pixelToChunkCoord(coord, this.chunkSize);
    if (oldChunkCoord === newChunkCoord) return;

    // remove from old chunk
    const objects = this.coordMap.get(oldChunkCoord) ?? [];
    const index = objects.indexOf(object);
    if (index !== -1) objects.splice(index, 1);

    // add to new chunk
    const newObjects = this.coordMap.get(newChunkCoord) ?? [];
    newObjects.push(object);

    this.coordMap.set(newChunkCoord, newObjects);
    this.coordMap.set(oldChunkCoord, objects);

    // update visibility
    if (this.chunkManager.isVisibleChunk(newChunkCoord)) {
      object.setActive(true).setVisible(true);
    } else {
      object.setActive(false).setVisible(false);
    }
  }

  setBoundingBoxes(id: string, boundingBoxes: BoundingBox[]) {
    this.boundingBoxes.set(id, boundingBoxes);
    let isVisible = false;

    for (const boundingBox of boundingBoxes) {
      if (this.chunkManager.isVisibleBoundingBox(boundingBox)) {
        isVisible = true;
        break;
      }
    }

    if (isVisible) {
      const object = this.objMap.get(id);
      if (!object) return;

      this.count--;
      if (!object.isSpawned()) {
        object.spawn();
      }

      object.setActive(true).setVisible(true);
    }
  }

  onNewObject(callback: (id: string) => void) {
    this.onNewObjectCallbacks.push(callback);

    return () => {
      const index = this.onNewObjectCallbacks.indexOf(callback);
      if (index !== -1) this.onNewObjectCallbacks.splice(index, 1);
    };
  }

  onObjectEnterChunk(callback: (id: string) => void) {
    this.onObjectEnterChunkCallbacks.push(callback);

    return () => {
      const index = this.onObjectEnterChunkCallbacks.indexOf(callback);
      if (index !== -1) this.onObjectEnterChunkCallbacks.splice(index, 1);
    };
  }

  remove(id: string, destroy = false, decrement = false) {
    const object = this.objMap.get(id);
    if (!object) return;

    const chunkCoord = pixelToChunkCoord({ x: object.x, y: object.y }, this.chunkSize);
    const objects = this.coordMap.get(chunkCoord) ?? [];

    const index = objects.indexOf(object);
    if (index !== -1) objects.splice(index, 1);

    this.objMap.delete(id);
    this.boundingBoxes.delete(id);
    if (destroy) object.destroy();
    if (decrement) this.count--;
  }

  get(id: string) {
    return this.objMap.get(id);
  }

  has(id: string) {
    return this.objMap.has(id);
  }

  getVisibleChunks() {
    return this.chunkManager.getVisibleChunks();
  }

  encodeKeyForChunk(coord: Coord) {
    return this.chunkManager.encodeKeyForChunk(coord);
  }

  decodeKeyFromChunk(key: string) {
    return this.chunkManager.decodeKeyFromChunk(key);
  }

  dispose() {
    this.objMap.forEach((object) => object.destroy());
    this.chunkManager.dispose();
  }

  private onEnterChunk(chunkCoord: Coord) {
    // OBJECTS
    const objects = this.coordMap.get(chunkCoord) ?? [];
    objects.forEach((object) => {
      this.count++;
      if (!object.isSpawned()) {
        object.spawn();
      }
      object.setActive(true).setVisible(true);
      this.onObjectEnterChunkCallbacks.forEach((callback) => callback(object.id));
    });

    // BOUNDING BOXES
    // considering that we check all boxes here, we don't need to repeat the same logic in `onExitChunk`
    const boundingBoxes = this.boundingBoxes;
    boundingBoxes.forEach((boundingBoxes, id) => {
      const object = this.objMap.get(id);

      if (object) {
        let isVisible = false;

        for (const boundingBox of boundingBoxes) {
          if (this.chunkManager.isVisibleBoundingBox(boundingBox)) {
            isVisible = true;
            break;
          }
        }

        object.setActive(isVisible).setVisible(isVisible).spawn();
      }
    });
  }

  private onExitChunk(chunkCoord: Coord) {
    const objects = this.coordMap.get(chunkCoord) ?? [];

    objects.forEach((object) => {
      this.count--;
      object.setActive(false).setVisible(false);
    });
  }
}
