import { AnimationConfig, Animations } from "@primodiumxyz/assets";
import { EDirection } from "@primodiumxyz/contracts";
import { Coord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";
import { DepthLayers } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

const OFFSET_X = -26;
const OFFSET_Y = -14;

export class ShieldEater extends Phaser.GameObjects.Zone {
  private location: Phaser.GameObjects.Sprite;
  private destination: Phaser.GameObjects.Sprite;
  private crack: Phaser.GameObjects.Sprite;
  private crackDelay: number;
  private _scene: PrimodiumScene;
  private coord: Coord;

  constructor(scene: PrimodiumScene, planetId: Entity, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);
    this._scene = scene;
    this.coord = coord;

    this.location = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x + OFFSET_X,
      coord.y + OFFSET_Y,
      "spriteAtlas",
    )
      .setDepth(DepthLayers.ShieldEater)
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.destination = new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x, coord.y, "spriteAtlas")
      .setDepth(DepthLayers.ShieldEater)
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
    this.scene.add.existing(this.destination);
    this.scene.add.existing(this.crack);

    const detonateConfig = AnimationConfig.find((anim) => anim.key === Animations["ShieldEaterDetonate"]);
    this.crackDelay = (((detonateConfig?.endFrame ?? 1) - 1) / (detonateConfig?.frameRate ?? 1)) * 1000;
  }

  override setScale(scale: number) {
    this.location.setScale(scale);
    this.destination.setScale(scale);
    this.crack.setScale(scale);
    super.setScale(scale);

    return this;
  }

  setShieldEaterLocation(present: boolean, playAnims: boolean) {
    if (!playAnims && present) {
      this.location.setActive(true).setVisible(true);
      this.offsetLocationEnter("restore");
      this.location.play(Animations["ShieldEaterIdle"]);
      return this.location;
    } else if (!playAnims && !present) {
      this.location.setActive(false).setVisible(false);
      this.offsetLocationExit("restore");
      return this.location;
    }

    if (present) {
      setTimeout(() => {
        this.location.setActive(true).setVisible(true);
        this.location.setDepth(DepthLayers.Planet - 1);
        this.offsetLocationEnter("offset");

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
          this.offsetLocationEnter("restore");
          this.offsetLocationIdle("offset");
          this.location.play(Animations["ShieldEaterIdle"]);
        });
      }, 2000);
    } else {
      this.offsetLocationExit("offset");
      this.offsetLocationIdle("restore");
      this.location.play(Animations["ShieldEaterExit"]);
      this.location.once("animationcomplete", () => {
        this.location.setActive(false).setVisible(false);
        this.offsetLocationExit("restore");
      });
    }

    return this.location;
  }

  setShieldEaterPath(turns: number, turnsToDestination: number | undefined) {
    if (turns > 0) {
      // distribute opacity from 0.3 (furthest) to 1 (destination)
      const opacity = turnsToDestination ? 0.3 + 0.7 * (turns / turnsToDestination) : 1;
      this.destination.play(Animations["ShieldEaterTarget"]);
      this.destination.setActive(true).setVisible(true).setAlpha(opacity);
    } else {
      this.destination.setActive(false).setVisible(false);
    }

    return this.destination;
  }

  shieldEaterDetonate() {
    this._scene.fx.emitVfx({ x: this.coord.x, y: this.coord.y }, "ShieldEaterDetonate", {
      depth: DepthLayers.ShieldEater,
      blendMode: Phaser.BlendModes.ADD,
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
      this.crack.play(Animations["ShieldEaterCrack"]);
      this.crack.once("animationcomplete", () => {
        setTimeout(() => {
          this.crack.setActive(false).setVisible(false);
        }, 2000);
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

  private offsetLocationIdle(type: "offset" | "restore") {
    if (type === "offset") {
      this.location.setX(this.coord.x + 4);
      this.location.setY(this.coord.y);
    } else {
      this.location.setX(this.coord.x + OFFSET_X);
      this.location.setY(this.coord.y + OFFSET_Y);
    }
  }

  private offsetLocationEnter(type: "offset" | "restore") {
    // const offsetX = this.coord.x - 26.5;
    // const offsetY = this.coord.y + 6;
    // if (type === "offset") {
    //   this.location.setX(offsetX);
    //   this.location.setY(offsetY);
    // } else {
    //   this.location.setX(this.coord.x);
    //   this.location.setY(this.coord.y);
    // }
  }

  private offsetLocationExit(type: "offset" | "restore") {
    // const offsetX = this.coord.x - 97.5;
    // const offsetY = this.coord.y - 18.5;
    // if (type === "offset") {
    //   this.location.setX(offsetX);
    //   this.location.setY(offsetY);
    // } else {
    //   this.location.setX(this.coord.x);
    //   this.location.setY(this.coord.y);
    // }
  }
}
