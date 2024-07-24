import { deferred } from "@engine/lib/util/deferred";

export const getSceneLoadPromise = async (scene: Phaser.Scene) => {
  const [resolve, , promise] = deferred();
  scene.load.once("complete", resolve);
  await promise;
};
