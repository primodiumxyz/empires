import { AnimationKeys, Animations, Assets, SpriteKeys, Sprites } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { OverheatThresholdToBorderSpriteKeys, OverheatThresholdToFlameAnimationKeys } from "@game/lib/mappings";
import { PrimodiumScene } from "@game/types";

export class Overheat extends Phaser.GameObjects.Container {
  private minProgressForBorder = 0.1;
  private minProgressForFlames = 0.25;
  private border: Phaser.GameObjects.Sprite;
  private flames: Phaser.GameObjects.Sprite;
  private flamesAnimation: AnimationKeys | undefined;

  constructor(scene: PrimodiumScene, coord: Coord, progress: number = 0) {
    super(scene.phaserScene, coord.x, coord.y);

    this.border = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, Assets.SpriteAtlas).setBlendMode(
      Phaser.BlendModes.ADD,
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
    this.setActive(progress > 0).setVisible(progress > 0);
  }

  private setBorder(progress: number) {
    this.border.setTexture(Assets.SpriteAtlas, Sprites[this.getBorderProgressSprite(progress)]);
    return this;
  }

  private setFlames(progress: number) {
    if (progress >= this.minProgressForFlames) {
      const anim = this.getFlamesProgressThresholdAnimation(progress);
      if (!this.flames.anims.isPlaying || anim !== this.flamesAnimation) {
        this.flames.play(Animations[anim]).setActive(true).setVisible(true);
      }

      // Reposition flames at the bottom center of the border
      this.flames.setPosition(0, this.border.height / 2 - 12);
      this.flamesAnimation = anim;
    } else {
      this.flames.setVisible(false).setActive(false);
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
    return OverheatThresholdToBorderSpriteKeys[1];
  }

  private getFlamesProgressThresholdAnimation(progress: number): AnimationKeys {
    if (progress >= 1) return OverheatThresholdToFlameAnimationKeys["full"];
    if (progress >= 0.5) return OverheatThresholdToFlameAnimationKeys["medium"];
    return OverheatThresholdToFlameAnimationKeys["low"];
  }
}
