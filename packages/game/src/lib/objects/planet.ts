import { PixelCoord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { IPrimodiumGameObject } from "./interfaces";
import { Assets, Sprites } from "@primodiumxyz/assets";
import {
  EmpireToHexFrameSpriteKeys,
  EmpireToHexSpriteKeys,
  EmpireToPlanetSpriteKeys,
} from "@game/lib/mappings";
import { getRandomRange } from "@primodiumxyz/core";

export class Planet
  extends Phaser.GameObjects.Container
  implements IPrimodiumGameObject
{
  readonly id: Entity;
  protected _scene: PrimodiumScene;
  private planetUnderglowSprite: Phaser.GameObjects.Sprite;
  private planetSprite: Phaser.GameObjects.Sprite;
  private hexSprite: Phaser.GameObjects.Sprite;
  private hexFrameSprite: Phaser.GameObjects.Sprite;
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
      0,
      -25,
      Assets.SpriteAtlas,
      Sprites.PlanetUnderglow
    ).setBlendMode(Phaser.BlendModes.SCREEN);

    this.planetSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      0,
      -25,
      Assets.SpriteAtlas,
      Sprites[EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey"]
    ).setScale(1);

    this.hexFrameSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      0,
      0,
      Assets.SpriteAtlas,
      Sprites[EmpireToHexFrameSpriteKeys[empire] ?? "HexFrameGrey"]
    );

    this.hexSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      0,
      0,
      Assets.SpriteAtlas,
      Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"]
    );

    this._scene = scene;
    this.id = id;
    this.add([
      this.hexSprite,
      this.hexFrameSprite,
      this.planetUnderglowSprite,
      this.planetSprite,
    ]);

    this.planetSprite.preFX?.addShine(getRandomRange(0.1, 0.5), 1.5, 4);

    this._scene.objects.planet.add(id, this, false);
  }

  spawn() {
    this.spawned = true;
    this.scene.add.existing(this);
    return this;
  }

  isSpawned() {
    return this.spawned;
  }

  updateFaction(faction: keyof typeof EmpireToPlanetSpriteKeys) {
    this.planetSprite.setTexture(
      Assets.SpriteAtlas,
      Sprites[EmpireToPlanetSpriteKeys[faction] ?? "PlanetGrey"]
    );
    this.hexSprite.setTexture(
      Assets.SpriteAtlas,
      Sprites[EmpireToHexSpriteKeys[faction] ?? "HexGrey"]
    );
  }

  override destroy() {
    super.destroy();
  }
}
