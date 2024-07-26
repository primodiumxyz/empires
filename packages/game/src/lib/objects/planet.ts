import { PixelCoord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { IPrimodiumGameObject } from "./interfaces";
import { Animations, Assets, Sprites } from "@primodiumxyz/assets";
import {
  EmpireToConquerAnimationKeys,
  EmpireToHexSpriteKeys,
  EmpireToPendingAnimationKeys,
  EmpireToPlanetSpriteKeys,
} from "@game/lib/mappings";
import {
  calculateAngleBetweenPoints,
  getRandomRange,
} from "@primodiumxyz/core";
import { DepthLayers } from "@game/lib/constants/common";

export class Planet
  extends Phaser.GameObjects.Zone
  implements IPrimodiumGameObject
{
  readonly id: Entity;
  readonly coord: PixelCoord;
  protected _scene: PrimodiumScene;
  private planetUnderglowSprite: Phaser.GameObjects.Sprite;
  private planetSprite: Phaser.GameObjects.Sprite;
  private hexSprite: Phaser.GameObjects.Sprite;
  private hexHoloSprite: Phaser.GameObjects.Sprite;
  private pendingArrow: Phaser.GameObjects.Container;
  private spawned = false;

  constructor(args: {
    id: Entity;
    scene: PrimodiumScene;
    coord: PixelCoord;
    empire: keyof typeof EmpireToPlanetSpriteKeys;
  }) {
    const { id, scene, coord, empire } = args;

    super(scene.phaserScene, coord.x, coord.y);

    this.planetUnderglowSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y - 25,
      Assets.SpriteAtlas,
      Sprites.PlanetUnderglow
    )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(DepthLayers.Planet - 1);

    this.planetSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y - 25,
      Assets.SpriteAtlas,
      Sprites[EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey"]
    ).setDepth(DepthLayers.Planet);

    this.hexSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y,
      Assets.SpriteAtlas,
      Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"]
    ).setDepth(DepthLayers.Base + coord.y);

    this.hexHoloSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y + 75,
      Assets.SpriteAtlas
    ).setDepth(DepthLayers.Base + coord.y - 1);

    this.pendingArrow = new Phaser.GameObjects.Container(
      scene.phaserScene,
      coord.x,
      coord.y,
      [
        new Phaser.GameObjects.Sprite(
          scene.phaserScene,
          75,
          25,
          Assets.SpriteAtlas
        )
          .play(Animations.PendingBlue)
          .setBlendMode(Phaser.BlendModes.ADD),
      ]
    )
      .setDepth(DepthLayers.PendingArrows)
      .setActive(false)
      .setVisible(false);

    this.hexHoloSprite.play(Animations.Holo);

    this._scene = scene;
    this.id = id;
    this.coord = coord;

    this.setDepth(DepthLayers.Planet + coord.y - coord.x);

    this.planetSprite.preFX?.addShine(getRandomRange(0.1, 0.5), 1.5, 4);

    this._scene.objects.planet.add(id, this, false);
  }

  spawn() {
    this.spawned = true;
    this.scene.add.existing(this);
    this.scene.add.existing(this.planetUnderglowSprite);
    this.scene.add.existing(this.planetSprite);
    this.scene.add.existing(this.hexHoloSprite);
    this.scene.add.existing(this.hexSprite);
    this.scene.add.existing(this.pendingArrow);
    return this;
  }

  isSpawned() {
    return this.spawned;
  }

  updateFaction(faction: keyof typeof EmpireToPlanetSpriteKeys) {
    this._scene.audio.play("Blaster", "sfx");
    this._scene.fx.emitVfx(
      { x: this.x, y: this.y - 29 },
      EmpireToConquerAnimationKeys[faction] ?? "ConquerBlue",
      {
        depth: DepthLayers.Marker,
        blendMode: Phaser.BlendModes.ADD,
        onFrameChange: (frameNumber) => {
          if (frameNumber === 6) {
            this.planetSprite.setTexture(
              Assets.SpriteAtlas,
              Sprites[EmpireToPlanetSpriteKeys[faction] ?? "PlanetGrey"]
            );
          }
        },
      }
    );

    this._scene.fx.flashSprite(this.hexSprite);

    this.hexSprite.setTexture(
      Assets.SpriteAtlas,
      Sprites[EmpireToHexSpriteKeys[faction] ?? "HexGrey"]
    );
  }

  setPendingMove(
    empireId: keyof typeof EmpireToPendingAnimationKeys,
    destinationPlanetId: Entity
  ) {
    const destinationPlanet =
      this._scene.objects.planet.get(destinationPlanetId);

    if (!destinationPlanet) return;

    const angle = calculateAngleBetweenPoints(
      this.coord,
      destinationPlanet.coord
    );

    this.pendingArrow.setRotation(angle.radian);

    this.pendingArrow.setVisible(true).setActive(true);
    (this.pendingArrow.getAt(0) as Phaser.GameObjects.Sprite).play(
      Animations[EmpireToPendingAnimationKeys[empireId] ?? "PendingBlue"]
    );
  }

  removePendingMove() {
    this.pendingArrow.setVisible(false).setActive(false);
  }

  override destroy() {
    this.pendingArrow.destroy();
    this.planetSprite.destroy();
    this.planetUnderglowSprite.destroy();
    this.hexSprite.destroy();
    this.hexHoloSprite.destroy();
    this._scene.objects.planet.remove(this.id);
    super.destroy();
  }
}
