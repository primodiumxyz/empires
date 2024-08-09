import { Coord } from "@primodiumxyz/engine";
import { DepthLayers } from "@game/lib/constants/common";
import { IconLabel } from "@game/lib/objects/IconLabel";
import { PrimodiumScene } from "@game/types";

export class ShieldEater extends Phaser.GameObjects.Container {
  private location: Phaser.GameObjects.Sprite;
  private destination: Phaser.GameObjects.Sprite;
  // TODO(SE): temp
  private locationLabel: IconLabel;
  private destinationLabel: IconLabel;

  constructor(scene: PrimodiumScene, coord: Coord) {
    super(scene.phaserScene, coord.x, coord.y);

    // TODO(SE): temp
    this.locationLabel = new IconLabel(scene, { x: coord.x, y: coord.y - 70 }, "", "ShieldEaterLocation", {
      color: "white",
    })
      .setDepth(DepthLayers.ShieldEater)
      .setScale(2)
      .setVisible(false);
    this.destinationLabel = new IconLabel(scene, { x: coord.x, y: coord.y - 70 }, "", "ShieldEaterDestination", {
      color: "white",
    })
      .setDepth(DepthLayers.ShieldEater)
      .setScale(2)
      .setVisible(false);
    this.add([this.locationLabel, this.destinationLabel]);
  }

  setShieldEaterLocation(present: boolean) {
    // TODO(SE): temp
    this.locationLabel.setText(present ? "🐍" : "").setVisible(true);
    this.locationLabel.setVisible(present);
    if (present && this.destinationLabel.visible) this.setShieldEaterDestination(0);

    return this;
  }

  setShieldEaterDestination(turns: number) {
    // TODO(SE): temp
    this.destinationLabel.setVisible(turns > 0);
    this.destinationLabel.setText(turns ? `🎯${turns.toLocaleString()}` : "").setVisible(turns > 0);

    return this;
  }

  setShieldEaterPath(turns: number) {
    // TODO(SE): temp
    this.destinationLabel.setText(turns.toLocaleString()).setVisible(turns > 0);

    return this;
  }

  detonateShieldEaterDamage() {
    // TODO(SE): detonate shield eater
    this.destinationLabel.setText("💣💣💣").setVisible(true);
    setTimeout(() => {
      this.destinationLabel.setVisible(false);
    }, 3000);

    return this;
  }

  detonateShieldEaterCollateralDamage() {
    // TODO(SE): detonate shield eater collateral damage
    this.destinationLabel.setText("💣").setVisible(true);
    setTimeout(() => {
      this.destinationLabel.setVisible(false);
    }, 3000);

    return this;
  }
}
