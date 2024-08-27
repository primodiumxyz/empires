import { Animations } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

export class AcidRain extends Phaser.GameObjects.Container {
  private largeCloud: Phaser.GameObjects.Sprite;
  private cycles = 0;

  constructor(scene: PrimodiumScene, planetId: Entity, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);

    this.largeCloud = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.add(this.largeCloud);
  }

  setAcid(cycles: number, expiring: boolean, playAnims: boolean) {
    if (cycles === this.cycles) return;

    if (this.cycles === 0 && cycles === 2) {
      // 1. New acid rain: enter large
      this.largeCloud.setActive(true).setVisible(true);
      if (playAnims) {
        this.largeCloud.play(Animations["AcidRainEnter"]);
        this.largeCloud.on("animationcomplete", () => {
          this.largeCloud.play(Animations["AcidRainLarge"]);
        });
      } else {
        this.largeCloud.play(Animations["AcidRainLarge"]);
      }
    } else if (this.cycles === 2 && cycles === 1) {
      // 2. Time passed, decaying
      // TODO: transition to medium
    } else if (this.cycles === 1 && cycles === 1 && expiring) {
      // 3. Time passed, only a few sub turns left, decaying
      // TODO: transition to small
    } else {
      // 4. Expired: exit
      if (playAnims) {
        this.largeCloud.play(Animations["AcidRainExit"]);
        this.largeCloud.on("animationcomplete", () => {
          this.largeCloud.setActive(false).setVisible(false);
        });
      } else {
        this.largeCloud.setActive(false).setVisible(false);
      }
    }

    this.cycles = cycles;
  }
}
