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
import {
  calculateAngleBetweenPoints,
  entityToPlanetName,
  formatNumber,
  lerp,
} from "@primodiumxyz/core";
import { DepthLayers } from "@game/lib/constants/common";
import { EEmpire } from "@primodiumxyz/contracts";
import { isValidClick, isValidHover } from "@game/lib/utils/inputGuards";
import { IconLabel } from "@game/lib/objects/IconLabel";
import { Progress } from "@game/lib/objects/Progress";

export class Planet
  extends Phaser.GameObjects.Zone
  implements IPrimodiumGameObject
{
  readonly id: Entity;
  readonly coord: PixelCoord;
  protected _scene: PrimodiumScene;
  private planetUnderglowSprite: Phaser.GameObjects.Image;
  private planetSprite: Phaser.GameObjects.Sprite;
  private hexSprite: Phaser.GameObjects.Sprite;
  private hexHoloSprite: Phaser.GameObjects.Sprite;
  private planetName: Phaser.GameObjects.Text;
  private pendingArrow: Phaser.GameObjects.Container;
  private chargeProgress: Progress;
  private shields: IconLabel;
  private ships: IconLabel;
  private gold: IconLabel;
  private magnets: [red: IconLabel, blue: IconLabel, green: IconLabel];
  private empireId: EEmpire;
  private spawned = false;

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

    this.planetName = new Phaser.GameObjects.Text(
      scene.phaserScene,
      coord.x,
      coord.y + 25,
      entityToPlanetName(id),
      {
        fontSize: 25,
        color: "rgba(255,255,255,0.5)",
        fontFamily: "Silkscreen",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: { x: 10 },
      }
    )
      .setOrigin(0.5, 0.5)
      .setAlpha(0.25)
      .setDepth(DepthLayers.Planet - 1);

    this.shields = new IconLabel(
      scene,
      {
        x: coord.x - 45,
        y: coord.y + 35,
      },
      "0",
      "Shield"
    ).setDepth(DepthLayers.Planet - 1);

    this.ships = new IconLabel(
      scene,

      {
        x: coord.x + 45,
        y: coord.y + 35,
      },
      "0",
      "Ship"
    ).setDepth(DepthLayers.Planet - 1);

    this.gold = new IconLabel(
      scene,
      {
        x: coord.x,
        y: coord.y + 60,
      },
      "0",
      "Gold"
    ).setDepth(DepthLayers.Planet - 1);

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

    this.chargeProgress = new Progress(scene, {
      x: coord.x,
      y: coord.y + 5,
    }).setDepth(DepthLayers.Planet + 1);

    this.magnets = [
      new IconLabel(
        scene,
        { x: coord.x + 75, y: coord.y - 60 },
        "0",
        "Attack",
        { color: "red" }
      )
        .setDepth(DepthLayers.Planet - 1)
        .setVisible(false),
      new IconLabel(
        scene,
        { x: coord.x + 75, y: coord.y - 30 },
        "0",
        "Attack",
        { color: "blue" }
      )
        .setDepth(DepthLayers.Planet - 1)
        .setVisible(false),
      new IconLabel(scene, { x: coord.x + 75, y: coord.y - 0 }, "0", "Attack", {
        color: "green",
      })
        .setDepth(DepthLayers.Planet - 1)
        .setVisible(false),
    ];

    this._scene = scene;
    this.id = id;
    this.coord = coord;
    this.empireId = empire;

    this._scene.objects.planet.add(id, this, false);
  }

  spawn() {
    this.spawned = true;
    this.scene.add.existing(this);
    this.scene.add.existing(this.planetName);
    this.scene.add.existing(this.planetUnderglowSprite);
    this.scene.add.existing(this.planetSprite);
    this.scene.add.existing(this.hexHoloSprite);
    this.scene.add.existing(this.hexSprite);
    this.scene.add.existing(this.pendingArrow);
    this.scene.add.existing(this.shields);
    this.scene.add.existing(this.ships);
    this.scene.add.existing(this.gold);
    this.scene.add.existing(this.chargeProgress);
    this.magnets.forEach((magnet) => {
      this.scene.add.existing(magnet);
    });
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
    this.planetName.setScale(scale);
    this.shields.setScale(scale);
    this.ships.setScale(scale);
    this.gold.setScale(scale);
    this.chargeProgress.setScale(scale);
    this.magnets.forEach((magnet) => {
      magnet.setScale(scale);
    });
    return this;
  }

  override update(): void {
    const alpha = lerp(
      this._scene.camera.phaserCamera.zoom,
      this._scene.config.camera.minZoom,
      this._scene.config.camera.defaultZoom,
      0,
      1
    );
    const nameAlpha = lerp(
      this._scene.camera.phaserCamera.zoom,
      this._scene.config.camera.minZoom,
      this._scene.config.camera.defaultZoom,
      0.5,
      0
    );

    this.shields.setAlpha(alpha);
    this.ships.setAlpha(alpha);
    this.gold.setAlpha(alpha);
    this.chargeProgress.setAlpha(alpha);
    this.magnets.forEach((magnet) => {
      magnet.setAlpha(alpha);
    });
    this.planetName.setAlpha(nameAlpha);
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

      fn(e);
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

  setShieldCount(count: bigint) {
    this.shields.setText(
      formatNumber(count, {
        short: true,
        showZero: true,
        fractionDigits: 2,
      })
    );
  }

  setShipCount(count: bigint) {
    this.ships.setText(
      formatNumber(count, {
        short: true,
        showZero: true,
        fractionDigits: 2,
      })
    );
  }

  setGoldCount(count: bigint) {
    this.gold.setText(
      formatNumber(count, {
        short: true,
        showZero: true,
        fractionDigits: 2,
      })
    );
  }

  setChargeProgress(progress: number) {
    this.chargeProgress.setProgress(progress);
  }

  setMagnet(empire: EEmpire, turns: number) {
    this.magnets[empire - 1]
      ?.setText(formatNumber(turns))
      .setVisible(turns > 0);

    return this;
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
