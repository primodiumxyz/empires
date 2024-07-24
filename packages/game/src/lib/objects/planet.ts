import { PixelCoord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { IPrimodiumGameObject } from "./interfaces";
import { Assets, Sprites } from "@primodiumxyz/assets";
import { EmpireToEmpireSpriteKeys } from "@game/lib/mappings";

export class Planet
  extends Phaser.GameObjects.Sprite
  implements IPrimodiumGameObject
{
  readonly id: Entity;
  protected _scene: PrimodiumScene;
  private spawned = false;

  constructor(args: {
    id: Entity;
    scene: PrimodiumScene;
    coord: PixelCoord;
    empire: keyof typeof EmpireToEmpireSpriteKeys;
  }) {
    const { id, scene, coord, empire } = args;

    super(
      scene.phaserScene,
      coord.x,
      coord.y,
      Assets.SpriteAtlas,
      Sprites[EmpireToEmpireSpriteKeys[empire] ?? "EmpireNeutral"]
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

  updateFaction(faction: keyof typeof EmpireToEmpireSpriteKeys) {
    this.setTexture(
      Assets.SpriteAtlas,
      Sprites[EmpireToEmpireSpriteKeys[faction] ?? "EmpireNeutral"]
    );
  }

  override destroy() {
    super.destroy();
  }
}
