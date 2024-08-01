import { PixelCoord } from '@primodiumxyz/engine';
import { Entity } from '@primodiumxyz/reactive-tables';

import { PrimodiumScene } from '@game/types';
import { IPrimodiumGameObject } from './interfaces';
import { Assets, Sprites } from '@primodiumxyz/assets';
import { EmpireToEmpireSpriteKeys } from '@game/lib/mappings';
import { getRandomRange } from '@primodiumxyz/core';

export class Planet
  extends Phaser.GameObjects.Sprite
  implements IPrimodiumGameObject
{
  readonly id: Entity;
  protected _scene: PrimodiumScene;
  private spawned = false;
  private lastPercent: number = 0;

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
      Sprites[EmpireToEmpireSpriteKeys[empire] ?? 'EmpireNeutral'],
    );

    this._scene = scene;
    this.id = id;
    this.preFX?.addShine(getRandomRange(0.1, 0.5), 1.5, 4);

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
      Sprites[EmpireToEmpireSpriteKeys[faction] ?? 'EmpireNeutral'],
    );

    this.updateCharge(this.lastPercent ?? 0);
  }

  updateCharge(percent: number) {
    this.lastPercent = percent;
  }

  override destroy() {
    super.destroy();
  }
}
