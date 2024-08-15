import { Animations } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { DepthLayers } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

export class ShieldEater extends Phaser.GameObjects.Container {
  private location: Phaser.GameObjects.Sprite;
  private destination: Phaser.GameObjects.Sprite;
  private _scene: PrimodiumScene;
  private coord: Coord;

  constructor(scene: PrimodiumScene, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);
    this._scene = scene;
    this.coord = coord;

    this.location = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.destination = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    this.add([this.location, this.destination]);
  }

  setShieldEaterLocation(present: boolean) {
    if (present) {
      setTimeout(() => {
        this.location.setActive(true).setVisible(true);
        this.offsetLocationEnter("offset");

        this.location.play(Animations["ShieldEaterEnter"]);
        this.location.once("animationcomplete", () => {
          this.offsetLocationEnter("restore");
          this.location.play(Animations["ShieldEaterIdle"]);
        });
      }, 2000);
    } else {
      this.offsetLocationExit("offset");
      this.location.play(Animations["ShieldEaterExit"]);
      this.location.once("animationcomplete", () => {
        this.location.setActive(false).setVisible(false);
        this.offsetLocationExit("restore");
      });
    }

    return this.location;
  }

  setShieldEaterPath(turns: number, turnsToDestination?: number) {
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

  shieldEaterCrack() {
    this._scene.fx.emitVfx({ x: this.coord.x, y: this.coord.y }, "ShieldEaterCrack", {
      depth: DepthLayers.ShieldEater,
      blendMode: Phaser.BlendModes.ADD,
    });

    return this;
  }

  private offsetLocationEnter(type: "offset" | "restore") {
    const offsetX = -26.5;
    const offsetY = 6;

    if (type === "offset") {
      this.location.setX(this.location.x + offsetX);
      this.location.setY(this.location.y + offsetY);
    } else {
      this.location.setX(this.location.x - offsetX);
      this.location.setY(this.location.y - offsetY);
    }
  }

  private offsetLocationExit(type: "offset" | "restore") {
    const offsetX = -97.5;
    const offsetY = -18.5;

    if (type === "offset") {
      this.location.setX(this.location.x + offsetX);
      this.location.setY(this.location.y + offsetY);
    } else {
      this.location.setX(this.location.x - offsetX);
      this.location.setY(this.location.y - offsetY);
    }
  }
}
