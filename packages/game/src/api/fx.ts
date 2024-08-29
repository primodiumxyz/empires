import { AnimationKeys, Animations, Assets, SpriteKeys, Sprites } from "@primodiumxyz/assets";
import { getRandomRange, sleep } from "@primodiumxyz/core";
import { Coord, Scene } from "@primodiumxyz/engine";
import { GlobalApi } from "@game/api/global";
import { DepthLayers } from "@game/lib/constants/common";

export const createFxApi = (scene: Scene, globalApi: GlobalApi) => {
  function outline(
    gameObject: Phaser.GameObjects.Sprite,
    options: {
      thickness?: number;
      color?: number;
      knockout?: boolean;
    } = {},
  ) {
    const { thickness = 1.5, color = 0x00ffff, knockout } = options;

    if (!(gameObject instanceof Phaser.GameObjects.Sprite)) return;

    gameObject.postFX?.addGlow(color, thickness, undefined, knockout);
  }

  function removeOutline(gameObject: Phaser.GameObjects.Sprite) {
    gameObject.postFX.clear();
  }

  // We need to use this instead of delaying the animation, to delay the sprite creation as well
  // otherwise it gets created too early and when emitted can go behind another sprite that was created inbetween
  const applyDelay = (callback: () => void, delay: number) => {
    if (delay === 0) return callback();
    return sleep(delay).then(callback);
  };

  function emitFloatingText(
    coord: Coord,
    text: string,
    options: {
      color?: string;
      duration?: number;
      icon?: SpriteKeys;
      fontSize?: number;
      iconSize?: number;
      delay?: number;
      marginX?: number;
      marginY?: number;
      borderStyle?: {
        width: number;
        color: number;
        alpha: number;
      };
      fillStyle?: {
        color: number;
        alpha: number;
      };
    } = {},
  ) {
    if (!globalApi.tables.GameState.get()?.visible) return;

    const {
      color = "#00ffff",
      duration = 4000,
      icon: iconSpriteKey,
      fontSize = 14,
      iconSize = 20,
      delay = 0,
      marginX = 5,
      marginY = 5,
      borderStyle = {
        width: 1,
        color: 0x00ffff,
        alpha: 0.25,
      },
      fillStyle = {
        color: 0x000000,
        alpha: 0.75,
      },
    } = options;

    applyDelay(() => {
      let icon: Phaser.GameObjects.Image | undefined;
      const container = scene.phaserScene.add.container(coord.x, coord.y).setScale(0).setDepth(DepthLayers.Marker);

      if (iconSpriteKey) {
        icon = scene.phaserScene.add.image(0, 0, Assets.SpriteAtlas, Sprites[iconSpriteKey]);

        icon.displayWidth = iconSize;
        icon.scaleY = icon.scaleX;
      }

      const floatingText = scene.phaserScene.add
        .text((icon?.displayWidth ?? 0) / 2, -2, text, {
          fontFamily: "Silkscreen",
          fontSize,
          color,
          align: "center",
          metrics: {
            ascent: 10,
            descent: 10,
            fontSize,
          },
        })
        .setStroke("#000000", 5)
        .setOrigin(0.5, 0.5);

      if (icon) icon.setX(-(floatingText.displayWidth / 2));

      const graphics = scene.phaserScene.add.graphics();

      graphics
        .fillStyle(fillStyle.color, fillStyle.alpha)
        .lineStyle(borderStyle.width, borderStyle.color, borderStyle.alpha);

      graphics.fillRoundedRect(
        -((icon?.displayWidth ?? 0) + floatingText.displayWidth + marginX * 2) / 2,
        (-Math.max(icon?.displayHeight ?? 0, floatingText.displayHeight) - marginY * 2) / 2,
        (icon?.displayWidth ?? 0) + floatingText.displayWidth + marginX * 2,
        Math.max(icon?.displayHeight ?? 0, floatingText.displayHeight) + marginY * 2,
        6,
      );

      graphics.strokeRoundedRect(
        -((icon?.displayWidth ?? 0) + floatingText.displayWidth + marginX * 2) / 2,
        (-Math.max(icon?.displayHeight ?? 0, floatingText.displayHeight) - marginY * 2) / 2,
        (icon?.displayWidth ?? 0) + floatingText.displayWidth + marginX * 2,
        Math.max(icon?.displayHeight ?? 0, floatingText.displayHeight) + marginY * 2,
        6,
      );

      container.add([graphics, floatingText, icon].filter(Boolean) as Phaser.GameObjects.GameObject[]);

      scene.phaserScene.add
        .timeline([
          {
            at: 0,
            run: () => {
              scene.phaserScene.tweens.add({
                targets: container,
                y: "-=40",
                x: `+=${getRandomRange(-20, 20)}`,
                ease: Phaser.Math.Easing.Expo.Out,
                duration,
              });

              scene.phaserScene.tweens.add({
                targets: container,
                scale: [0.5, 1.5, 1],
                ease: Phaser.Math.Easing.Quintic.InOut,
                duration: 300,
              });
            },
          },

          {
            at: duration / 4,
            run: () => {
              scene.phaserScene.tweens.add({
                targets: container,
                alpha: 0,
                scale: 0,
                ease: Phaser.Math.Easing.Quintic.In,
                duration: duration / 4,
              });
            },
          },
          {
            at: duration,
            run: () => container.destroy(),
          },
        ])
        .play();
    }, delay);
  }

  function flashScreen(options?: { duration?: number; color?: number }) {
    if (!globalApi.tables.GameState.get()?.visible) return;

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
      speed?: number;
      blendMode?: Phaser.BlendModes;
      rotation?: number;
      originX?: number;
      originY?: number;
      offset?: Coord;
      onComplete?: () => void;
    },
  ) {
    if (!globalApi.tables.GameState.get()?.visible) return;

    const {
      scale = 1,
      depth = DepthLayers.Base,
      speed = 1,
      onComplete,
      onFrameChange,
      blendMode = Phaser.BlendModes.NORMAL,
      rotation,
      originX = 0.5,
      originY = 0.5,
      offset,
    } = options || {};

    const sprite = scene.phaserScene.add.sprite(offset ? offset.x : coord.x, offset ? offset.y : coord.y, "vfx-atlas");

    const vfx = offset ? scene.phaserScene.add.container(coord.x, coord.y, [sprite]) : sprite;

    vfx.setScale(scale);
    vfx.setDepth(depth);
    vfx.setRotation(rotation);
    sprite.setBlendMode(blendMode);
    sprite.setOrigin(originX, originY);

    sprite.on("animationupdate", (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
      if (onFrameChange) {
        onFrameChange(frame.index);
      }
    });

    sprite.on("animationcomplete", () => {
      vfx.destroy();
      if (onComplete) {
        onComplete();
      }
    });

    sprite.anims.timeScale = speed;
    sprite.play(Animations[animationKey]);
  }

  function flashSprite(sprite: Phaser.GameObjects.Sprite, duration = 400, wait = 100, repeat = 3) {
    if (!globalApi.tables.GameState.get()?.visible) return;

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
        }),
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
