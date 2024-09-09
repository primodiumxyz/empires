import { AnimationConfig, Animations } from "@primodiumxyz/assets";
import { EDirection } from "@primodiumxyz/contracts";
import { Coord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";
import { DepthLayers } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

export class ShieldEater extends Phaser.GameObjects.Zone {
  private location: Phaser.GameObjects.Sprite;
  private path: Phaser.GameObjects.Sprite;
  private crack: Phaser.GameObjects.Sprite;
  private crackDelay: number;
  private _scene: PrimodiumScene;
  private coord: Coord;

  constructor(scene: PrimodiumScene, planetId: Entity, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);
    this._scene = scene;
    this.coord = coord;

    this.location = new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x - 26, coord.y - 14, "spriteAtlas")
      .setDepth(DepthLayers.ShieldEater)
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.path = new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x, coord.y, "spriteAtlas")
      .setDepth(DepthLayers.Planet + 1)
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.crack = new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x, coord.y, "spriteAtlas")
      .setDepth(DepthLayers.Planet - 1)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setActive(false)
      .setVisible(false);

    this.scene.add.existing(this.location);
    this.scene.add.existing(this.path);
    this.scene.add.existing(this.crack);

    const detonateConfig = AnimationConfig.find((anim) => anim.key === Animations["ShieldEaterDetonate"]);
    this.crackDelay = (((detonateConfig?.endFrame ?? 1) - 1) / (detonateConfig?.frameRate ?? 1)) * 1000;
  }

  override setScale(scale: number) {
    this.location.setScale(scale);
    this.path.setScale(scale);
    this.crack.setScale(scale);
    super.setScale(scale);

    return this;
  }

  setShieldEaterLocation(present: boolean, playAnims: boolean) {
    if (!playAnims && present) {
      this.location.setActive(true).setVisible(true);
      this.location.play(Animations["ShieldEaterIdle"]);
      return this.location;
    } else if (!playAnims && !present) {
      this.location.setActive(false).setVisible(false);
      return this.location;
    }

    if (present) {
      setTimeout(() => {
        this.location.setActive(true).setVisible(true);
        this.location.setDepth(DepthLayers.Planet - 1);

        this.location.play(Animations["ShieldEaterEnter"]);
        this.location.on(
          "animationupdate",
          (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
            if (frame.index === 10) {
              this.location.setDepth(DepthLayers.ShieldEater);
              this.location.off("animationupdate");
            }
          },
        );
        this.location.once("animationcomplete", () => {
          this.location.play(Animations["ShieldEaterIdle"]);
        });
      }, 3000);
    } else {
      this.location.play(Animations["ShieldEaterExit"]);
      this.location.once("animationcomplete", () => {
        this.location.setActive(false).setVisible(false);
      });
    }

    return this.location;
  }

  setShieldEaterPath(turns: number, turnsToDestination: number | undefined) {
    if (turns > 0) {
      // distribute opacity from 0.3 (furthest) to 1 (destination)
      const opacity = turnsToDestination ? 0.3 + 0.7 * (turns / turnsToDestination) : 1;
      this.path.play(Animations["ShieldEaterTarget"]);
      this.path.setActive(true).setVisible(true).setAlpha(opacity);
    } else {
      this.path.setActive(false).setVisible(false);
    }

    return this.path;
  }

  shieldEaterDetonate() {
    this.location.play(Animations["ShieldEaterDetonate"]);
    this.location.once("animationcomplete", () => {
      this.location.play(Animations["ShieldEaterExit"]);
      this.location.once("animationcomplete", () => {
        this.location.setActive(false).setVisible(false);
      });
    });

    return this;
  }

  // direction of this planet relative to the shield eater detonation
  // e.g. direction = EDirection.East means the crack should be on the left side of this planet
  shieldEaterCrack(direction: EDirection) {
    const { x, y, rotation } = this.getCrackParams(direction);
    this.crack.setX(x);
    this.crack.setY(y);
    this.crack.setRotation(rotation);

    setTimeout(() => {
      this.crack.setActive(true).setVisible(true);
      this.crack.setAlpha(1);
      this.crack.play(Animations["ShieldEaterCrack"]);
      this.crack.once("animationcomplete", () => {
        this.scene.tweens.add({
          targets: this.crack,
          alpha: 0,
          duration: 2000,
          ease: "Linear",
          onComplete: () => {
            this.crack.setActive(false).setVisible(false);
          },
        });
      });
    }, this.crackDelay);

    return this;
  }

  private getCrackParams(direction: EDirection) {
    switch (direction) {
      case EDirection.East:
        return {
          x: this.coord.x - 46,
          y: this.coord.y + 26,
          rotation: (2 * Math.PI) / 3,
        };
      case EDirection.Southeast:
        return {
          x: this.coord.x - 24,
          y: this.coord.y - 16,
          rotation: Math.PI,
        };
      case EDirection.Southwest:
        return {
          x: this.coord.x + 22,
          y: this.coord.y - 18,
          rotation: (-2 * Math.PI) / 3,
        };
      case EDirection.West:
        return {
          x: this.coord.x + 47,
          y: this.coord.y + 24,
          rotation: -Math.PI / 3,
        };
      case EDirection.Northwest:
        return {
          x: this.coord.x + 24,
          y: this.coord.y + 66,
          rotation: 0,
        };
      case EDirection.Northeast:
        return {
          x: this.coord.x - 24,
          y: this.coord.y + 66,
          rotation: Math.PI / 3,
        };
      default:
        return {
          x: this.coord.x - 24,
          y: this.coord.y + 66,
          rotation: Math.PI / 3,
        };
    }
  }
}
