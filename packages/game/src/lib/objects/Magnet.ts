import { Animations } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { DepthLayers } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

export class Magnet extends Phaser.GameObjects.Container {
  private empire: EEmpire;
  private turns = 0;
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;

  constructor(scene: PrimodiumScene, x: number, y: number, empire: EEmpire) {
    super(scene.phaserScene, x, y);
    this.empire = empire;

    this.sprite = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setDepth(DepthLayers.Planet + 1);

    this.label = new Phaser.GameObjects.Text(scene.phaserScene, 25, 0, "0", {
      fontFamily: "Silkscreen",
      fontSize: "13px",
      color: this.getColorForEmpire(),
    })
      .setOrigin(0, 0.5)
      .setDepth(DepthLayers.Planet + 1);

    this.add([this.sprite, this.label]);
    this.setVisible(false);
  }

  setMagnet(turns: number) {
    if (turns === this.turns) return;

    if (turns > 0) {
      this.setVisible(true);
      if (!this.sprite.anims.isPlaying) {
        this.sprite.play(this.getAnimationForEmpire());
      }
      const fullTurnLeft = Math.ceil(turns / 3);
      const subTurnLeft = turns % 3;
      const text = turns > 2 ? formatNumber(fullTurnLeft) : `${"●".repeat(subTurnLeft)}`;
      this.label.setText(text);
    } else {
      this.sprite.anims.playReverse(this.getAnimationForEmpire());
      this.sprite.once("animationcomplete", () => {
        this.setVisible(false);
      });
    }

    this.turns = turns;
  }

  hasMagnet(): boolean {
    return this.turns > 0;
  }

  private getColorForEmpire(): string {
    switch (this.empire) {
      case EEmpire.Red:
        return "#ff0000";
      case EEmpire.Blue:
        return "#0000ff";
      case EEmpire.Green:
        return "#00ff00";
      default:
        return "#ffffff";
    }
  }

  private getAnimationForEmpire(): string {
    switch (this.empire) {
      case EEmpire.Red:
        return Animations.MagnetRed;
      case EEmpire.Blue:
        return Animations.MagnetBlue;
      case EEmpire.Green:
        return Animations.MagnetGreen;
      default:
        return Animations.MagnetBlue;
    }
  }
}
