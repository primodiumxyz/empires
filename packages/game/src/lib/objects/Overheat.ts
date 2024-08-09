import TransitionImage from "phaser3-rex-plugins/plugins/transitionimage.js";

import { AnimationKeys, Animations, Assets, SpriteKeys, Sprites } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { OverheatThresholdToBorderSpriteKeys, OverheatThresholdToFlameAnimationKeys } from "@game/lib/mappings";
import { PrimodiumScene } from "@game/types";

export class Overheat extends Phaser.GameObjects.Container {
  private progress = 0;
  private border: TransitionImage;
  private flames: Phaser.GameObjects.Sprite;
  private flamesAnimation: AnimationKeys | undefined;

  constructor(scene: PrimodiumScene, coord: Coord, progress: number = 0) {
    super(scene.phaserScene, coord.x, coord.y);

    this.border = new TransitionImage(
      scene.phaserScene,
      0,
      0,
      Assets.SpriteAtlas,
      Sprites[OverheatThresholdToBorderSpriteKeys[0]],
      {
        duration: 1000,
      },
    );

    this.flames = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, Assets.VfxAtlas)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setOrigin(0.5, 1); // bottom center

    this.add([this.border, this.flames]);
    this.setProgress(progress);
  }

  setProgress(progress: number) {
    this.setBorder(progress);
    this.setFlames(progress);
    this.progress = progress;
  }

  private setBorder(progress: number) {
    const currentSprite = this.getBorderProgressSprite(this.progress);
    const nextSprite = this.getBorderProgressSprite(progress);
    if (currentSprite !== nextSprite) {
      this.border.transit(Assets.SpriteAtlas, Sprites[nextSprite]);
    }

    return this;
  }

  private setFlames(progress: number) {
    const anim = this.getFlamesProgressThresholdAnimation(progress);
    if (anim) {
      if (!this.flames.anims.isPlaying || anim !== this.flamesAnimation) {
        this.flames.play(Animations[anim]).setActive(true).setVisible(true);
      }

      // Reposition flames at the bottom center of the border
      this.flames.setPosition(0, this.border.height / 2 - 12);
      this.flames.setAlpha(progress >= 1 ? 0.7 : 1);
      this.flames.setActive(true).setVisible(true);
      this.flamesAnimation = anim;
    } else {
      this.scene.tweens.add({
        targets: this.flames,
        alpha: 0,
        duration: 1000,
        onComplete: () => this.flames.setVisible(false).setActive(false),
      });

      this.flamesAnimation = undefined;
    }

    return this;
  }

  private getBorderProgressSprite(progress: number): SpriteKeys {
    if (progress >= 1) return OverheatThresholdToBorderSpriteKeys[6];
    if (progress >= 0.9) return OverheatThresholdToBorderSpriteKeys[5];
    if (progress >= 0.7) return OverheatThresholdToBorderSpriteKeys[4];
    if (progress >= 0.5) return OverheatThresholdToBorderSpriteKeys[3];
    if (progress >= 0.3) return OverheatThresholdToBorderSpriteKeys[2];
    if (progress >= 0.1) return OverheatThresholdToBorderSpriteKeys[1];
    return OverheatThresholdToBorderSpriteKeys[0];
  }

  private getFlamesProgressThresholdAnimation(progress: number): AnimationKeys | undefined {
    if (progress >= 1) return OverheatThresholdToFlameAnimationKeys["full"];
    if (progress >= 0.5) return OverheatThresholdToFlameAnimationKeys["medium"];
    if (progress >= 0.3) return OverheatThresholdToFlameAnimationKeys["low"];
    return undefined;
  }
}
