import { deferred } from "@engine/lib/util/deferred";
import { createScene as _createScene } from "@engine/lib/core/createScene";

export type Scene = Awaited<ReturnType<typeof _createScene>>;

export const createSceneManager = (phaserGame: Phaser.Game) => {
  const scenes = new Map<string, Scene>();

  const createScene = async (
    config: Parameters<typeof _createScene>[1],
    autoStart = true
  ) => {
    const scene = await _createScene(phaserGame, config, autoStart);
    scenes.set(config.key, scene);

    return scene;
  };

  const addScene = async (scene: Scene) => {
    scenes.set(scene.config.key, scene);
    return scene;
  };

  const removeScene = (key: string) => {
    if (!phaserGame) throw new Error("Phaser game not initialized");

    scenes.get(key)?.dispose();
    scenes.delete(key);
    phaserGame.scene.remove(key);
  };

  const transitionToScene = async (
    key: string,
    target: string,
    duration = 1000,
    onTransitionStart?: (originScene: Scene, targetScene: Scene) => void,
    onTransitionComplete?: (originScene: Scene, targetScene: Scene) => void,
    sleep = true
  ) => {
    const [resolve, , promise] = deferred();
    const originScene = scenes.get(key);
    const targetScene = scenes.get(target);

    if (!originScene) {
      console.warn(`Origin Scene ${key} not found`);
      return;
    }

    if (!targetScene) {
      console.warn(`Target Scene ${target} not found`);
      return;
    }

    if (
      !originScene.phaserScene.scene.isActive() ||
      targetScene.phaserScene.scene.isActive()
    )
      return;

    onTransitionStart?.(originScene, targetScene);

    originScene?.phaserScene.scene.transition({
      target,
      // moveAbove: true,
      sleep,
      duration,
      allowInput: false,
    });

    targetScene.phaserScene.events.once(
      Phaser.Scenes.Events.TRANSITION_COMPLETE,
      resolve
    );

    await promise;

    onTransitionComplete?.(originScene, targetScene);
  };

  return {
    scenes,
    createScene,
    addScene,
    removeScene,
    transitionToScene,
    dispose: () => {
      for (const [key] of scenes) {
        removeScene(key);
      }
    },
  };
};
