import { Coord } from "@primodiumxyz/engine";
import { PrimodiumScene } from "@game/types";

export class Overheat extends Phaser.GameObjects.Container {
  private fullBar: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;
  private _scene: PrimodiumScene;
  constructor(scene: PrimodiumScene, coord: Coord, progress: number = 0) {
    super(scene.phaserScene, coord.x, coord.y);

    this.fullBar = new Phaser.GameObjects.Rectangle(scene.phaserScene, 0, 0, 100, 10, 0x000000)
      .setOrigin(0.5, 0.5)
      .setAlpha(0.75)
      .setStrokeStyle(1, 0x00ffff, 0.25);

    this.bar = new Phaser.GameObjects.Rectangle(scene.phaserScene, -this.fullBar.width / 2, 0, 75, 10, 0x00ffff)
      .setOrigin(0, 0.5)
      .setAlpha(0.25);

    this.setProgress(progress);

    this._scene = scene;

    // Add icon and text to the container
    this.add([this.fullBar, this.bar]);
  }

  setProgress(progress: number) {
    this.bar.width = Math.min(this.fullBar.width * progress, 100);
  }
}
