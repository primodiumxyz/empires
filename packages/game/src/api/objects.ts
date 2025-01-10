import { Coord, Scene } from "@primodiumxyz/engine";
import { BoundingBox, PrimodiumGameObject } from "@primodiumxyz/engine/src/lib/core/StaticObjectManager";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Planet } from "@game/lib/objects/Planet";

export type PrimodiumObjectApi<T extends PrimodiumGameObject> = {
  has: (entity: Entity) => boolean;
  get: (entity: Entity) => T | undefined;
  remove: (entity: Entity, destroy?: boolean, decrement?: boolean) => void;
  add: (entity: Entity, object: PrimodiumGameObject, cull?: boolean) => PrimodiumGameObject;
  updatePosition: (entity: Entity, coord: Coord) => void;
  setBoundingBoxes: (entity: Entity, boundingBoxes: BoundingBox[]) => void;
  onNewObject: (callback: (entity: string) => void) => () => void;
  onObjectVisible: (callback: (entity: string) => void) => () => void;
};

function factory<T extends PrimodiumGameObject>(
  scene: Scene,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objectClass: abstract new (...args: any[]) => T,
  prefix?: string,
): PrimodiumObjectApi<T> {
  const fullId = (entity: Entity) => `${prefix ? `${prefix}_` : ""}${entity}`;

  return {
    add: (entity: Entity, object: PrimodiumGameObject, cull = false) => {
      if (object instanceof objectClass) {
        scene.objects.add(fullId(entity), object, cull);
        return object;
      } else {
        throw new Error("Object is not an instance of the expected class");
      }
    },
    updatePosition: (entity: Entity, coord) => {
      if (!scene.objects.has(fullId(entity))) throw new Error("Object not found");
      scene.objects.updateObjectPosition(fullId(entity), coord);
    },
    has: (entity: Entity) => scene.objects.has(fullId(entity)),
    get: (entity: Entity) => {
      const object = scene.objects.get(fullId(entity));
      return object instanceof objectClass ? object : undefined;
    },
    remove: (entity: Entity, destroy = false, decrement = false) => {
      const id = fullId(entity);
      scene.objects.remove(id, destroy, decrement);
    },
    setBoundingBoxes: (entity: Entity, boundingBoxes: BoundingBox[]) => {
      if (!scene.objects.has(fullId(entity))) throw new Error("Object not found");
      scene.objects.setBoundingBoxes(fullId(entity), boundingBoxes);
    },
    onNewObject: (callback: (entity: string) => void) => {
      return scene.objects.onNewObject(callback);
    },
    onObjectVisible: (callback: (entity: string) => void) => {
      return scene.objects.onObjectEnterChunk(callback);
    },
  };
}

export type PrimodiumObjectApiMap = {
  planet: PrimodiumObjectApi<Planet>;
};

// Wrapper around scene.objects.get to provide type safety
export function createObjectApi(scene: Scene): PrimodiumObjectApiMap {
  return {
    planet: factory(scene, Planet),
  };
}
