import { SceneKeys } from "@game/lib/constants/common";
import { Game, Scene } from "@primodiumxyz/engine";

export type GlobalApi = ReturnType<typeof createGlobalApi>;

//api pertaining
export function createGlobalApi(game: Game) {
  function setResolution(width: number, height: number) {
    const { phaserGame, sceneManager } = game;

    sceneManager.scenes.forEach((scene) => {
      const camera = scene.phaserScene.cameras.main;

      // Calculate the current center position of the camera's viewport
      const currentCenterX = camera.scrollX + camera.width * 0.5;
      const currentCenterY = camera.scrollY + camera.height * 0.5;

      // Adjust the viewport to the new dimensions
      camera.setViewport(0, 0, width, height);

      // Adjust the camera's scroll position based on the new viewport size
      camera.scrollX = currentCenterX - width * 0.5;
      camera.scrollY = currentCenterY - height * 0.5;
    });

    phaserGame.scale.resize(width, height);
  }

  function setTarget(id: string) {
    const div = game.phaserGame.canvas;

    const target = document.getElementById(id);

    if (target === null) {
      console.warn("No target found with id " + id);
      return;
    }

    target.appendChild(div);

    setResolution(
      target.offsetWidth * window.devicePixelRatio,
      target.offsetHeight * window.devicePixelRatio
    );
  }

  function getConfig() {
    return game.phaserGame.config;
  }

  function getScene(scene: SceneKeys) {
    return game.sceneManager.scenes.get(scene);
  }

  async function transitionToScene(
    origin: SceneKeys,
    target: SceneKeys,
    duration = 0,
    onTransitionStart?: (originScene: Scene, targetScene: Scene) => undefined,
    onTransitionEnd?: (originScene: Scene, targetScene: Scene) => undefined
  ) {
    if (origin === target) return;

    await game.sceneManager.transitionToScene(
      origin,
      target,
      duration,
      onTransitionStart,
      onTransitionEnd
    );
  }

  function enableGlobalInput() {
    game.sceneManager.scenes.forEach((scene) => {
      scene.input.enableInput();
    });
  }

  function disableGlobalInput() {
    game.sceneManager.scenes.forEach((scene) => {
      scene.input.disableInput();
    });
  }

  return {
    dispose: game.dispose,
    createScene: game.sceneManager.createScene,
    setResolution,
    setTarget,
    getConfig,
    transitionToScene,
    getScene,
    enableGlobalInput,
    disableGlobalInput,
  };
}
