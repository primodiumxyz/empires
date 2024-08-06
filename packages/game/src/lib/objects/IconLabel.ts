import { PrimodiumScene } from "@game/types";
import { Assets, SpriteKeys, Sprites } from "@primodiumxyz/assets";
import { Coord } from "@primodiumxyz/engine";

export class IconLabel extends Phaser.GameObjects.Container {
  private label: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Image;
  private _scene: PrimodiumScene;
  constructor(
    scene: PrimodiumScene,
    coord: Coord,
    text: string,
    iconKey: SpriteKeys,
    options: {
      fontSize?: number;
      iconSize?: number;
      color?: string;
    } = {}
  ) {
    super(scene.phaserScene, coord.x, coord.y);

    const { fontSize = 13, iconSize = 22, color = "#00ffff" } = options;

    // Create icon
    this.icon = scene.phaserScene.add.image(
      0,
      0,
      Assets.SpriteAtlas,
      Sprites[iconKey]
    );

    this.icon.displayWidth = iconSize;
    this.icon.scaleY = this.icon.scaleX;

    // Create text
    this.label = scene.phaserScene.add
      .text(0, 0, text, {
        fontFamily: "Silkscreen",
        fontSize,
        color,
        align: "center",
        backgroundColor: "rgba(0, 255, 255, 0.05)",
        padding: { x: 10, y: 2 },
        resolution: 2,
      })
      .setOrigin(0.5, 0.5)
      .setStroke("black", 2);

    this.updatePositions();

    this._scene = scene;

    // Add icon and text to the container
    this.add([this.icon, this.label]);
  }

  updatePositions() {
    this.icon.setPosition(-this.label.displayWidth / 2, 0);
    this.label.setPosition(this.icon.displayWidth / 2, -2);
    const totalWidth = this.icon.displayWidth + this.label.width;

    // Set container size
    this.setSize(
      totalWidth,
      Math.max(this.icon.displayHeight, this.label.height)
    );
  }

  setText(text: string) {
    this.label.setText(text);
    this.updatePositions();

    return this;
  }
}
