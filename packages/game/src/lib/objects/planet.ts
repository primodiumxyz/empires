import { PixelCoord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { IPrimodiumGameObject } from "./interfaces";
import { Assets, Sprites } from "@primodiumxyz/assets";

export class Planet
  extends Phaser.GameObjects.Sprite
  implements IPrimodiumGameObject
{
  readonly id: Entity;
  protected _scene: PrimodiumScene;
  private spawned = false;

  constructor(args: { id: Entity; scene: PrimodiumScene; coord: PixelCoord }) {
    const { id, scene, coord } = args;
    super(
      scene.phaserScene,
      coord.x,
      coord.y,
      Assets.SpriteAtlas,
      Sprites.EmpireBlue
    );

    this._scene = scene;
    this.id = id;

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

  override destroy() {
    super.destroy();
  }
}
