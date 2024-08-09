import { Animations } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { DepthLayers } from "@game/lib/constants/common";
import { EmpireToHexColor, EmpireToMagnetAnimationKeys } from "@game/lib/mappings";
import { PrimodiumScene } from "@game/types";

export class Magnet extends Phaser.GameObjects.Container {
  private empire: EEmpire;
  private enabled = false;
  private turns = 0;
  private sprite: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;

  constructor(scene: PrimodiumScene, x: number, y: number, empire: EEmpire) {
    super(scene.phaserScene, x, y);
    this.empire = empire;

    this.sprite = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setDepth(DepthLayers.Magnet);

    this.label = new Phaser.GameObjects.Text(scene.phaserScene, 25, 0, "0", {
      fontFamily: "Silkscreen",
      fontSize: "13px",
      color: EmpireToHexColor[this.empire],
    })
      .setOrigin(0, 0.5)
      .setDepth(DepthLayers.Magnet);

    this.add([this.sprite, this.label]);
    this.setActive(false);
    this.setVisible(false);
  }

  setMagnet(turns: number, callback?: (oldTurns: number, newTurns: number) => void) {
    if (turns === this.turns) return;
    this.enabled = turns > 0;
    const blink = (duration: number) => {
      this.scene.tweens.killTweensOf(this.sprite);
      this.sprite.setAlpha(1);
      if (duration)
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0.5,
          duration: duration,
          yoyo: true,
          repeat: -1,
        });
    };

    if (turns > 0) {
      this.setActive(true).setVisible(true);
      callback?.(this.turns, turns);

      const fullTurnLeft = Math.ceil(turns / 3);
      const subTurnLeft = turns % 3;

      if (!this.sprite.anims.isPlaying && this.turns === 0) {
        this.sprite.play(Animations[EmpireToMagnetAnimationKeys[this.empire] ?? "MagnetRed"]);
      }

      // animate alpha to show a magnet close to expiration
      blink(turns === 2 ? 1000 : turns === 1 ? 500 : 0);

      const text = turns > 2 ? formatNumber(fullTurnLeft) : `${"●".repeat(subTurnLeft)}`;
      this.label.setText(text);
      this.scene.tweens.add({
        targets: this.label,
        alpha: 1,
        duration: 500,
      });
    } else {
      this.sprite.anims.playReverse(Animations[EmpireToMagnetAnimationKeys[this.empire] ?? "MagnetRed"]);
      this.sprite.once("animationcomplete", () => {
        this.setActive(false).setVisible(false);
        callback?.(this.turns, turns);
      });

      this.scene.tweens.add({
        targets: this.label,
        alpha: 0,
        duration: 1000,
      });
    }

    this.turns = turns;
    return this;
  }

  getEmpire(): EEmpire {
    return this.empire;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updatePosition(x: number, y: number) {
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: 50,
    });

    return this;
  }
}
