import { Scene, Coord } from "@primodiumxyz/engine";

import { DepthLayers } from "@game/lib/constants/common.ts";
import { AnimationKeys, Animations } from "@primodiumxyz/assets";

export const createFxApi = (scene: Scene) => {
  function outline(
    gameObject: Phaser.GameObjects.Sprite,
    options: {
      thickness?: number;
      color?: number;
      knockout?: boolean;
    } = {}
  ) {
    const { thickness = 1.5, color = 0x00ffff, knockout } = options;

    if (!(gameObject instanceof Phaser.GameObjects.Sprite)) return;

    gameObject.postFX?.addGlow(color, thickness, undefined, knockout);
  }

  function removeOutline(gameObject: Phaser.GameObjects.Sprite) {
    gameObject.postFX.clear();
  }

  function emitFloatingText(
    coord: Coord,
    text: string,
    options?: { color?: number; duration?: number }
  ) {
    const color = options?.color ?? 0x00ffff;
    const duration = options?.duration ?? 1000;

    const floatingText = scene.phaserScene.add
      .bitmapText(coord.x, coord.y, "teletactile", text, 4)
      .setDepth(DepthLayers.Marker)
      .setOrigin(0.5, 0)
      .setTintFill(color);

    scene.phaserScene.add
      .timeline([
        {
          at: 0,
          run: () => {
            scene.phaserScene.tweens.add({
              targets: floatingText,
              y: "-=20",
              ease: Phaser.Math.Easing.Quintic.In,
              duration,
            });
          },
        },

        {
          at: duration / 2,
          run: () => {
            scene.phaserScene.tweens.add({
              targets: floatingText,
              alpha: 0,
              ease: Phaser.Math.Easing.Quintic.In,
              duration: duration / 2,
            });
          },
        },
        {
          at: duration,
          run: () => floatingText.destroy(true),
        },
      ])
      .play();
  }

  function flashScreen(options?: { duration?: number; color?: number }) {
    function getRGBValues(value: number) {
      const hexValue = value.toString(16).padStart(6, "0");
      const red = parseInt(hexValue.slice(0, 2), 16);
      const green = parseInt(hexValue.slice(2, 4), 16);
      const blue = parseInt(hexValue.slice(4, 6), 16);
      return { red, green, blue };
    }

    const duration = options?.duration ?? 500;
    const color = options?.color ?? 0x0;
    // Create a white rectangle that covers the entire screen
    const camera = scene.camera;
    const { red, green, blue } = getRGBValues(color);
    camera.phaserCamera.flash(duration, color % red, green, blue, true);
    camera.phaserCamera.shake(700, 0.02 / camera.phaserCamera.zoom);
  }

  function emitVfx(
    coord: Coord,
    animationKey: AnimationKeys,
    options?: {
      onFrameChange?: (frameNumber: number) => void;
      scale?: number;
      depth?: number;
      onComplete?: () => void;
    }
  ) {
    const {
      scale = 1,
      depth = DepthLayers.Base,
      onComplete,
      onFrameChange,
    } = options || {};

    const sprite = scene.phaserScene.add.sprite(coord.x, coord.y, "vfx-atlas");
    sprite.setScale(scale);
    sprite.setDepth(depth);

    sprite.on(
      "animationupdate",
      (
        animation: Phaser.Animations.Animation,
        frame: Phaser.Animations.AnimationFrame
      ) => {
        if (onFrameChange) {
          onFrameChange(frame.index);
        }
      }
    );

    sprite.on("animationcomplete", () => {
      sprite.destroy();
      if (onComplete) {
        onComplete();
      }
    });

    sprite.play(Animations[animationKey]);
  }

  function flashSprite(
    sprite: Phaser.GameObjects.Sprite,
    duration = 400,
    wait = 100,
    repeat = 3
  ) {
    //flash outline on sprite twice

    let at = 0;
    scene.phaserScene.add
      .timeline(
        Array.from({ length: repeat * 2 }).map((_, i) => {
          const event = {
            at: at,
            run: () => (i % 2 === 0 ? outline(sprite) : removeOutline(sprite)),
          };

          at += i % 2 === 0 ? duration : wait;

          return event;
        })
      )
      .play();
  }

  return {
    outline,
    removeOutline,
    emitFloatingText,
    flashSprite,
    flashScreen,
    emitVfx,
  };
};
