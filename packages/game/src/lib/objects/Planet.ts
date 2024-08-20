import { Animations, Assets, Sprites } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { calculateAngleBetweenPoints, entityToPlanetName, formatNumber, lerp } from "@primodiumxyz/core";
import { PixelCoord } from "@primodiumxyz/engine";
import { Entity } from "@primodiumxyz/reactive-tables";
import { allEmpires, DepthLayers } from "@game/lib/constants/common";
import {
  EmpireToConquerAnimationKeys,
  EmpireToHexSpriteKeys,
  EmpireToMovementAnimationKeys,
  EmpireToPendingAnimationKeys,
  EmpireToPlanetSpriteKeys,
} from "@game/lib/mappings";
import { IconLabel } from "@game/lib/objects/IconLabel";
import { Magnet } from "@game/lib/objects/Magnet";
import { ShieldEater } from "@game/lib/objects/ShieldEater";
import { isValidClick, isValidHover } from "@game/lib/utils/inputGuards";
import { PrimodiumScene } from "@game/types";

import { IPrimodiumGameObject } from "./interfaces";

export class Planet extends Phaser.GameObjects.Zone implements IPrimodiumGameObject {
  readonly id: Entity;
  readonly coord: PixelCoord;
  protected _scene: PrimodiumScene;
  private shouldPlayAnims = true;
  private planetUnderglowSprite: Phaser.GameObjects.Image;
  private planetSprite: Phaser.GameObjects.Sprite;
  private hexSprite: Phaser.GameObjects.Sprite;
  private hexHoloSprite: Phaser.GameObjects.Sprite;
  private planetName: Phaser.GameObjects.Text;
  private pendingArrow: Phaser.GameObjects.Container;
  private shields: IconLabel;
  private ships: IconLabel;
  private gold: IconLabel;
  // private overheat: Overheat;
  private magnets: Magnet[];
  private magnetWaves: Phaser.GameObjects.Sprite;
  private shieldEater: ShieldEater;
  private citadel: Phaser.GameObjects.Sprite | null;
  private empireId: EEmpire;
  private spawned = false;

  constructor(args: {
    id: Entity;
    scene: PrimodiumScene;
    coord: PixelCoord;
    empire: EEmpire;
    citadel?: boolean;
    empireCount: number;
  }) {
    const { id, scene, coord, empire, citadel, empireCount } = args;

    super(scene.phaserScene, coord.x, coord.y);

    this.planetUnderglowSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y - 25,
      Assets.SpriteAtlas,
      Sprites.PlanetUnderglow,
    )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(DepthLayers.Planet - 1);

    this.planetSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y - 25,
      Assets.SpriteAtlas,
      Sprites[EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey"],
    ).setDepth(DepthLayers.Planet);

    this.hexSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y,
      Assets.SpriteAtlas,
      Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"],
    ).setDepth(DepthLayers.Base + coord.y);

    this.planetName = new Phaser.GameObjects.Text(scene.phaserScene, coord.x, coord.y + 25, entityToPlanetName(id), {
      fontSize: 25,
      color: "rgba(255,255,255,0.5)",
      fontFamily: "Silkscreen",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: { x: 10 },
    })
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
      "Shield",
    ).setDepth(DepthLayers.Planet - 1);

    this.ships = new IconLabel(
      scene,

      {
        x: coord.x + 45,
        y: coord.y + 35,
      },
      "0",
      "Ship",
    ).setDepth(DepthLayers.Planet - 1);

    this.gold = new IconLabel(
      scene,
      {
        x: coord.x,
        y: coord.y + 60,
      },
      "0",
      "Gold",
    ).setDepth(DepthLayers.Planet - 1);

    this.hexHoloSprite = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y + 75,
      Assets.SpriteAtlas,
      "sprites/hex/holo/Holo_Rough_0.png",
    ).setDepth(DepthLayers.Base + coord.y - 1);

    this.pendingArrow = new Phaser.GameObjects.Container(scene.phaserScene, coord.x, coord.y, [
      new Phaser.GameObjects.Sprite(scene.phaserScene, 75, 25, Assets.SpriteAtlas)
        .play(Animations.PendingBlue)
        .setBlendMode(Phaser.BlendModes.ADD),
    ])
      .setDepth(DepthLayers.PendingArrows)
      .setActive(false)
      .setVisible(false);

    // this.overheat = new Overheat(scene, coord, empire).setDepth(DepthLayers.Base + coord.y);

    this.magnets = allEmpires
      .slice(0, empireCount)
      .map((empire) => new Magnet(scene, coord.x + 75, coord.y - 60, empire));
    this.magnets.forEach((magnet) => magnet.setDepth(DepthLayers.Magnet));

    this.magnetWaves = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      this.planetSprite.x - 3,
      this.planetSprite.y + 5,
      Assets.VfxAtlas,
    )
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DepthLayers.MagnetWaves)
      .setActive(false)
      .setVisible(false);

    this.citadel = citadel
      ? new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x, coord.y - 70, Assets.SpriteAtlas, Sprites.Crown)
          .setOrigin(0.5, 0.5)
          .setDepth(DepthLayers.Planet + 1)
          .setScale(1.5)
      : null;

    this.shieldEater = new ShieldEater(scene, { x: this.planetSprite.x, y: this.planetSprite.y }).setDepth(
      DepthLayers.ShieldEater,
    );

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
    // this.scene.add.existing(this.overheat);
    this.scene.add.existing(this.shieldEater);
    if (this.citadel) this.scene.add.existing(this.citadel);
    this.magnets.forEach((magnet) => this.scene.add.existing(magnet));
    this.scene.add.existing(this.magnetWaves);
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
    // this.overheat.setScale(scale);
    if (this.citadel) this.citadel.setScale(scale);
    this.magnets.forEach((magnet) => magnet.setScale(scale));
    this.magnetWaves.setScale(scale);
    this.shieldEater.setScale(scale);
    if (this.citadel) this.citadel.setScale(scale);
    return this;
  }

  override update(): void {
    const alpha = lerp(
      this._scene.camera.phaserCamera.zoom,
      this._scene.config.camera.minZoom,
      this._scene.config.camera.defaultZoom,
      0,
      1,
    );
    const nameAlpha = lerp(
      this._scene.camera.phaserCamera.zoom,
      this._scene.config.camera.minZoom,
      this._scene.config.camera.defaultZoom,
      0.5,
      0,
    );

    this.shields.setAlpha(alpha);
    this.ships.setAlpha(alpha);
    this.gold.setAlpha(alpha);
    this.magnets.forEach((magnet) => magnet.setAlpha(alpha));
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
            this.planetSprite.setTexture(Assets.SpriteAtlas, Sprites[EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey"]);
          }
        },
      },
    );

    this._scene.fx.flashSprite(this.hexSprite);

    this.hexSprite.setTexture(Assets.SpriteAtlas, Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"]);

    // this.overheat.setEmpire(empire);
    this.empireId = empire;
  }

  setPendingMove(destinationPlanetId: Entity) {
    const destinationPlanet = this._scene.objects.planet.get(destinationPlanetId);

    if (!destinationPlanet) return;

    const angle = calculateAngleBetweenPoints(this.coord, destinationPlanet.coord);

    this.pendingArrow.setRotation(angle.radian);

    this.pendingArrow.setVisible(true).setActive(true);
    (this.pendingArrow.getAt(0) as Phaser.GameObjects.Sprite).play(
      Animations[EmpireToPendingAnimationKeys[this.empireId] ?? "PendingBlue"],
    );
  }

  removePendingMove() {
    this.pendingArrow.setVisible(false).setActive(false);
  }

  moveDestroyers(destinationPlanetId: Entity) {
    const destinationPlanet = this._scene.objects.planet.get(destinationPlanetId);

    if (!destinationPlanet) return;

    const angle = calculateAngleBetweenPoints(this.coord, destinationPlanet.coord);

    this._scene.fx.emitVfx(
      { x: this.coord.x, y: this.coord.y - 25 },
      EmpireToMovementAnimationKeys[this.empireId] ?? "MovementRed",
      {
        rotation: angle.radian,
        depth: DepthLayers.Planet + 1,
        originX: 0,
        originY: 1,
        speed: 1.5,
        blendMode: Phaser.BlendModes.ADD,
        offset: {
          x: -12,
          y: 10,
        },
        scale: 1.3,
      },
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
    obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, (e: Phaser.Input.Pointer) => {
      if (!isValidHover(e)) return;
      fn(e);
    });
    return this;
  }

  onHoverExit(fn: (e: Phaser.Input.Pointer) => void) {
    const obj = this.hexSprite.setInteractive();
    obj.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, (e: Phaser.Input.Pointer) => {
      fn(e);
    });
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
      }),
    );
  }

  setShipCount(count: bigint) {
    this.ships.setText(
      formatNumber(count, {
        short: true,
        showZero: true,
        fractionDigits: 2,
      }),
    );
  }

  setGoldCount(count: bigint) {
    this.gold.setText(
      formatNumber(count, {
        short: true,
        showZero: true,
        fractionDigits: 2,
      }),
    );
  }

  // setOverheatProgress(progress: number) {
  //   this.overheat.setProgress(progress);
  // }

  setMagnet(empire: EEmpire, turns: number) {
    const magnet = this.magnets[empire - 1];

    // emit only if no magnet is already active
    if (turns > 0 && !this.magnets.some((magnet) => magnet.isEnabled())) {
      this.magnetWaves.play(Animations["MagnetWaves"]);
      this.magnetWaves.setVisible(true).setActive(true);
    } else if (!turns && this.magnetWaves.visible && this.magnets.every((magnet) => !magnet.isEnabled())) {
      this.magnetWaves.once("animationrepeat", () => {
        this.magnetWaves.setVisible(false).setActive(false);
      });
    }

    // 1. when turns > 0 it will add/update the magnet & reorder magnets
    // to give space for the new one if needed
    // 2. when turns === 0 it will wait for the magnet to be removed
    // THEN reorder so it doesn't overlap
    magnet?.setMagnet(turns, (oldTurns, newTurns) => {
      // reorder only if the magnet is being removed or added
      if (!oldTurns || !newTurns) this.reorderMagnets();
    });

    return magnet;
  }

  private reorderMagnets(): void {
    const activeMagnets = this.magnets
      .filter((magnet) => magnet.isEnabled())
      .sort((a, b) => a.getEmpire() - b.getEmpire());
    activeMagnets.forEach((magnet, index) => magnet.updatePosition(this.coord.x + 75, this.coord.y - 60 + index * 30));
  }

  setShieldEaterLocation(present: boolean): ShieldEater["location"] {
    const location = this.shieldEater.setShieldEaterLocation(present);

    if (present) {
      this.shieldEater.setDepth(DepthLayers.Planet - 1);

      location.on(
        "animationupdate",
        (animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame) => {
          if (frame.index === 9) {
            this.shieldEater.setDepth(DepthLayers.ShieldEater);
            location.off("animationupdate");
          }
        },
      );
    }

    return location;
  }

  setShieldEaterPath(turns: number, turnsToDestination?: number): ShieldEater["destination"] {
    return this.shieldEater.setShieldEaterPath(turns, turnsToDestination);
  }

  shieldEaterDetonate(): ShieldEater {
    return this.shieldEater.shieldEaterDetonate();
  }

  shieldEaterCrack(): ShieldEater {
    return this.shieldEater.shieldEaterCrack();
  }

  setShouldPlayAnims(shouldPlayAnims: boolean) {
    this.shouldPlayAnims = shouldPlayAnims;
  }

  override destroy() {
    this.pendingArrow.destroy();
    this.planetSprite.destroy();
    this.planetUnderglowSprite.destroy();
    this.hexSprite.destroy();
    this.hexHoloSprite.destroy();
    this.citadel?.destroy();
    this._scene.objects.planet.remove(this.id);
    this.magnets.forEach((magnet) => magnet.destroy());
    this.magnetWaves.destroy();
    super.destroy();
  }
}
