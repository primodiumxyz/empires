import { SceneConfig } from "@engine/lib/types";
import { createTilemap } from "@engine/lib/core/createTilemap";
import { createCamera } from "@engine/lib/core/createCamera";
import createInput from "@engine/lib/core/createInput";
import { StaticObjectManager } from "@engine/lib/core/StaticObjectManager";
import { generateFrames } from "@engine/lib/util/generateFrames";
import { createPhaserScene } from "@engine/lib/util/createPhaserScene";
import { resizePhaserGame } from "@engine/lib/util/resizePhaserGame";

type PhaserAudio =
  | Phaser.Sound.HTML5AudioSoundManager
  | Phaser.Sound.WebAudioSoundManager
  | Phaser.Sound.NoAudioSoundManager;

export const createScene = async (
  phaserGame: Phaser.Game,
  config: SceneConfig,
  autoStart = true
) => {
  const {
    camera: { minZoom, maxZoom, pinchSpeed, wheelSpeed, defaultZoom },
    tilemap: { defaultKey, tileWidth, tileHeight, config: tilemapConfig },
    cullingChunkSize,
    animations,
  } = config;

  if (!phaserGame) throw new Error("Phaser game not initialized");

  const phaserScene = createPhaserScene({
    key: config.key,
  });

  const scene = new phaserScene();

  phaserGame.scene.add(config.key, scene, autoStart);

  const camera = createCamera(scene.cameras.main, {
    maxZoom,
    minZoom,
    pinchSpeed,
    wheelSpeed,
    defaultZoom,
  });

  const objects = new StaticObjectManager(camera, cullingChunkSize);

  const tiled = createTilemap(
    scene,
    tileWidth,
    tileHeight,
    defaultKey,
    tilemapConfig
  );

  //create sprite animations
  if (animations) {
    for (const anim of animations) {
      scene.anims.create({
        key: anim.key,
        frames: generateFrames(scene.anims, anim),
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }
  }

  const input = createInput(scene.input);

  camera.setZoom(defaultZoom);

  const resizer = resizePhaserGame(phaserGame);

  /* -------------------------- Create Audio Channels ------------------------- */
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  const music = Phaser.Sound.SoundManagerCreator.create(
    phaserGame
  ) as PhaserAudio;
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  const sfx = Phaser.Sound.SoundManagerCreator.create(
    phaserGame
  ) as PhaserAudio;
  /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
  //@ts-ignore
  const ui = Phaser.Sound.SoundManagerCreator.create(phaserGame) as PhaserAudio;

  return {
    phaserScene: scene,
    tiled,
    camera,
    config,
    input,
    objects,
    audio: {
      music,
      sfx,
      ui,
    },
    dispose: () => {
      music.destroy();
      sfx.destroy();
      ui.destroy();
      input.dispose();
      camera.dispose();
      objects.dispose();
      resizer.dispose();
    },
  };
};
