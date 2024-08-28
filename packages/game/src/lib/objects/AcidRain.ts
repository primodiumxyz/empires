import { AnimationKeys, Animations } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

export class AcidRain extends Phaser.GameObjects.Container {
  private cloud: Phaser.GameObjects.Sprite;
  private cycles = 0;
  private expiring = false;

  constructor(scene: PrimodiumScene, planetId: Entity, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);

    this.cloud = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.add(this.cloud);
  }

  setAcid(cycles: number, expiring: boolean, playAnims: boolean) {
    if (cycles === this.cycles && expiring === this.expiring) return;
    if (cycles > 0) this.cloud.setActive(true).setVisible(true);

    if (cycles === 2) {
      // 1. New acid rain: enter large
      this.transition({ from: "AcidRainEnterLarge", to: "AcidRainLarge", playAnims });
    } else if (cycles === 1 && !expiring) {
      // 2. Time passed, decaying
      if (this.cycles === 2) {
        this.transition({ from: "AcidRainEnterMedium", to: "AcidRainMedium", playAnims });
      } else {
        this.transition({ from: "AcidRainEnterLarge", insert: "AcidRainEnterMedium", to: "AcidRainMedium", playAnims });
      }
    } else if (cycles === 1 && expiring) {
      // 3. Time passed, only a few sub turns left, decaying
      if (this.cycles === 1) {
        this.transition({ from: "AcidRainEnterSmall", to: "AcidRainSmall", playAnims });
      } else {
        this.transition({ from: "AcidRainEnterLarge", insert: "AcidRainEnterSmall", to: "AcidRainSmall", playAnims });
      }
    } else {
      // 4. Expired: exit
      if (playAnims) {
        this.cloud.play(Animations["AcidRainExit"]);
        this.cloud.once("animationcomplete", () => {
          this.cloud.setActive(false).setVisible(false);
        });
      } else {
        this.cloud.setActive(false).setVisible(false);
      }
    }

    this.cycles = cycles;
    this.expiring = expiring;
  }

  // playAnims = true: play from -> (insert) -> to
  // playAnims = false: play to
  private transition(options: { from: AnimationKeys; to: AnimationKeys; playAnims: boolean; insert?: AnimationKeys }) {
    const { from, to, playAnims, insert } = options;

    if (playAnims) {
      this.cloud.play(Animations[from]);
      this.cloud.once("animationcomplete", () => {
        if (insert) {
          this.cloud.play(Animations[insert]);
          this.cloud.once("animationcomplete", () => {
            this.cloud.play(Animations[to]);
          });
        } else {
          this.cloud.play(Animations[to]);
        }
      });
    } else {
      this.cloud.play(Animations[to]);
    }
  }
}
