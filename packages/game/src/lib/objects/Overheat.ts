import { AnimationKeys, Animations, Assets, SpriteKeys } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { OverheatThresholdToBorderSpriteKeys, OverheatThresholdToFlameAnimationKeys } from "@game/lib/mappings";
import { PrimodiumScene } from "@game/types";

export class Overheat extends Phaser.GameObjects.Container {
  private minProgressForBorder = 10;
  private minProgressForFlames = 25;
  private flames: Phaser.GameObjects.Sprite;
  private flamesAnimation: AnimationKeys | undefined;

  constructor(scene: PrimodiumScene, coord: Coord, progress: number = 0) {
    super(scene.phaserScene, coord.x, coord.y);

    this.flames = new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x, coord.y, Assets.VfxAtlas).setBlendMode(
      Phaser.BlendModes.ADD,
    );

    this.setProgress(progress);
  }

  setProgress(progress: number) {
    this.setBorder(progress);
    this.setFlames(progress);
    this.setActive(progress > 0).setVisible(progress > 0);
  }

  private setBorder(progress: number) {
    return this;
  }

  private setFlames(progress: number) {
    if (progress >= this.minProgressForFlames) {
      const anim = this.getFlamesProgressThresholdAnimation(progress);
      if (!this.flames.anims.isPlaying || anim !== this.flamesAnimation) {
        this.flames.play(Animations[anim]).setActive(true).setVisible(true);
      }

      // this.setActive(true).setVisible(true);
      this.flamesAnimation = anim;
    } else {
      // this.flames.once("animationrepeat", () => {
      // this.flames.setVisible(false).setActive(false);
      this.flamesAnimation = undefined;
      // });
    }

    return this;
  }

  private getBorderProgressSprite(progress: number): SpriteKeys {
    if (progress >= 100) return OverheatThresholdToBorderSpriteKeys[6];
    if (progress >= 90) return OverheatThresholdToBorderSpriteKeys[5];
    if (progress >= 70) return OverheatThresholdToBorderSpriteKeys[4];
    if (progress >= 50) return OverheatThresholdToBorderSpriteKeys[3];
    if (progress >= 30) return OverheatThresholdToBorderSpriteKeys[2];
    return OverheatThresholdToBorderSpriteKeys[1];
  }

  private getFlamesProgressThresholdAnimation(progress: number): AnimationKeys {
    if (progress >= 100) return OverheatThresholdToFlameAnimationKeys["full"];
    if (progress >= 50) return OverheatThresholdToFlameAnimationKeys["medium"];
    return OverheatThresholdToFlameAnimationKeys["low"];
  }
}
