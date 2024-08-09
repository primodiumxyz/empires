import { Animations } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";
import { DepthLayers } from "@game/lib/constants/common";
import { IconLabel } from "@game/lib/objects/IconLabel";
import { PrimodiumScene } from "@game/types";

export class ShieldEater extends Phaser.GameObjects.Container {
  private location: Phaser.GameObjects.Sprite;
  private _scene: PrimodiumScene;
  private coord: Coord;

  // TODO(SE): temp
  private destinationLabel: IconLabel;

  constructor(scene: PrimodiumScene, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);
    this._scene = scene;
    this.coord = coord;

    this.location = new Phaser.GameObjects.Sprite(scene.phaserScene, 0, 0, "spriteAtlas")
      .setOrigin(0.5)
      .setActive(false)
      .setVisible(false);

    // TODO(SE): temp
    this.destinationLabel = new IconLabel(scene, { x: coord.x, y: coord.y - 70 }, "", "ShieldEaterDestination", {
      color: "white",
    })
      .setDepth(DepthLayers.ShieldEater)
      .setScale(2)
      .setVisible(false);

    this.add([this.location, this.destinationLabel]);
  }

  setShieldEaterLocation(present: boolean) {
    if (present) {
      this.location.play(Animations["ShieldEaterIdle"]);
      this.location.setActive(true).setVisible(true);
    } else {
      this.location.setActive(false).setVisible(false);
    }

    return this;
  }

  setShieldEaterDestination(turns: number) {
    // TODO(SE): temp
    this.destinationLabel.setVisible(turns > 0);
    this.destinationLabel.setText(`🐍🎯${turns.toLocaleString()}`).setVisible(turns > 0);

    return this;
  }

  setShieldEaterPath(turns: number) {
    // TODO(SE): temp
    this.destinationLabel.setText(`🐍${turns.toLocaleString()}`).setVisible(turns > 0);

    return this;
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
}
