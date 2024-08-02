import { PixelCoord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";
import { IPrimodiumGameObject } from "./interfaces";
import { Animations, Assets, Sprites } from "@primodiumxyz/assets";
import {
  EmpireToConquerAnimationKeys,
  EmpireToDestroyerArcAnimationKeys,
  EmpireToHexSpriteKeys,
  EmpireToPendingAnimationKeys,
  EmpireToPlanetSpriteKeys,
} from "@game/lib/mappings";
import { calculateAngleBetweenPoints } from "@primodiumxyz/core";
import { DepthLayers } from "@game/lib/constants/common";
import { EEmpire } from "@primodiumxyz/contracts";
import { isValidClick, isValidHover } from "@game/lib/utils/inputGuards";

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
  private empireId: EEmpire;
  private spawned = false;

  private lastClickTime = 0;
  private singleClickTimeout?: Phaser.Time.TimerEvent;

  constructor(args: {
    id: Entity;
    scene: PrimodiumScene;
    coord: PixelCoord;
    empire: EEmpire;
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
      Assets.SpriteAtlas,
      "sprites/hex/holo/Holo_Rough_0.png"
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

    this._scene = scene;
    this.id = id;
    this.coord = coord;
    this.empireId = empire;

    this.setDepth(DepthLayers.Planet + coord.y - coord.x);

    //TODO: disabled for perf
    // this.planetSprite.preFX?.addShine(getRandomRange(0.1, 0.5), 1.5, 4);

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

  override setScale(scale: number) {
    this.planetSprite.setScale(scale);
    this.planetUnderglowSprite.setScale(scale);
    this.hexSprite.setScale(scale);
    this.hexHoloSprite.setScale(scale);
    return this;
  }

  updateFaction(empire: EEmpire) {
    if (empire === this.empireId) return;

    this._scene.audio.play("Blaster", "sfx");
    this._scene.fx.emitVfx(
      { x: this.coord.x, y: this.coord.y - 29 },
      EmpireToConquerAnimationKeys[empire] ?? "ConquerBlue",
      {
        depth: DepthLayers.Marker,
        blendMode: Phaser.BlendModes.ADD,
        onFrameChange: (frameNumber) => {
          if (frameNumber === 6) {
            this.planetSprite.setTexture(
              Assets.SpriteAtlas,
              Sprites[EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey"]
            );
          }
        },
      }
    );

    this._scene.fx.flashSprite(this.hexSprite);

    this.hexSprite.setTexture(
      Assets.SpriteAtlas,
      Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"]
    );

    this.empireId = empire;
  }

  setPendingMove(destinationPlanetId: Entity) {
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
      Animations[EmpireToPendingAnimationKeys[this.empireId] ?? "PendingBlue"]
    );
  }

  removePendingMove() {
    this.pendingArrow.setVisible(false).setActive(false);
  }

  moveDestroyers(destinationPlanetId: Entity) {
    const destinationPlanet =
      this._scene.objects.planet.get(destinationPlanetId);

    if (!destinationPlanet) return;

    const angle = calculateAngleBetweenPoints(
      this.coord,
      destinationPlanet.coord
    );

    //lower
    this._scene.fx.emitVfx(
      { x: this.coord.x, y: this.coord.y - 25 },
      EmpireToDestroyerArcAnimationKeys[this.empireId][0] ??
        "DestroyerArcLowerRed",
      {
        rotation: angle.radian,
        depth: DepthLayers.Planet + 1,
        originX: 0,
        originY: 1,
        blendMode: Phaser.BlendModes.ADD,
        offset: {
          x: -12,
          y: 10,
        },
        scale: 1.3,
      }
    );
    //upper
    this._scene.fx.emitVfx(
      { x: this.coord.x, y: this.coord.y - 25 },
      EmpireToDestroyerArcAnimationKeys[this.empireId][1] ??
        "DestroyerArcUpperRed",
      {
        rotation: angle.radian + 2 * Math.PI,
        depth: DepthLayers.Planet + 2,
        originX: 0,
        originY: 1,
        offset: {
          x: -12,
          y: 15,
        },
        scale: 1.3,
      }
    );

    this._scene.audio.play("Execute2", "sfx", { volume: 0.1 });
  }

  onClick(fn: (e: Phaser.Input.Pointer) => void) {
    const obj = this.hexSprite.setInteractive();
    obj.on(Phaser.Input.Events.POINTER_UP, (e: Phaser.Input.Pointer) => {
      if (!isValidClick(e)) return;

      // Clear any existing timeout
      if (this.singleClickTimeout) {
        this.singleClickTimeout.destroy();
        this.singleClickTimeout = undefined;
      }

      // Set a new timeout for single-click
      this.singleClickTimeout = this.scene.time.delayedCall(200, () => {
        fn(e);
        this.singleClickTimeout = undefined;
      });
    });
    return this;
  }

  onDoubleClick(fn: (e: Phaser.Input.Pointer) => void) {
    const obj = this.hexSprite.setInteractive();
    obj.on(Phaser.Input.Events.POINTER_UP, (e: Phaser.Input.Pointer) => {
      if (!isValidClick(e)) return;

      const clickDelay = this.scene.time.now - this.lastClickTime;
      this.lastClickTime = this.scene.time.now;
      if (clickDelay < 200) {
        // If double-click, clear the single-click timeout
        if (this.singleClickTimeout) {
          this.singleClickTimeout.destroy();
          this.singleClickTimeout = undefined;
        }
        fn(e);
      }
    });
    return this;
  }

  onHoverEnter(fn: (e: Phaser.Input.Pointer) => void) {
    const obj = this.hexSprite.setInteractive();
    obj.on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_OVER,
      (e: Phaser.Input.Pointer) => {
        if (!isValidHover(e)) return;
        fn(e);
      }
    );
    return this;
  }

  onHoverExit(fn: (e: Phaser.Input.Pointer) => void) {
    const obj = this.hexSprite.setInteractive();
    obj.on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_OUT,
      (e: Phaser.Input.Pointer) => {
        fn(e);
      }
    );
    return this;
  }

  flashPlanet() {
    this._scene.fx.flashSprite(this.planetSprite);
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
