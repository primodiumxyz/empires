import { Animations, Assets, Sprites } from "@primodiumxyz/assets";
import { EDirection, EEmpire } from "@primodiumxyz/contracts";
import { calculateAngleBetweenPoints, formatNumber, lerp, TREASURE_PLANET_IRIDIUM_THRESHOLD } from "@primodiumxyz/core";
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
import { AcidRain } from "@game/lib/objects/AcidRain";
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
  private playAnims = true;
  private planetUnderglowSprite: Phaser.GameObjects.Image;
  private planetSprite: Phaser.GameObjects.Sprite;
  private hexSprite: Phaser.GameObjects.Sprite;
  private hexHoloSprite: Phaser.GameObjects.Sprite;
  private planetName: Phaser.GameObjects.Text;
  private pendingArrow: Phaser.GameObjects.Container;
  private pendingMove: Entity | null = null;
  private shields: IconLabel;
  private ships: IconLabel;
  private iridium: IconLabel;
  private magnets: Magnet[];
  private activeMagnets: Map<EEmpire, number> = new Map();
  private magnetWaves: Phaser.GameObjects.Sprite;
  private shieldEater: ShieldEater;
  private acidRain: AcidRain;
  private treasurePlanetDecoration: Phaser.GameObjects.Sprite;
  private citadelCrown: Phaser.GameObjects.Sprite | null = null;
  private citadelAsteroidBelt: Phaser.GameObjects.Sprite | null = null;
  private citadelShineInterval: NodeJS.Timeout | null = null;
  private empireId: EEmpire;
  private spawned = false;
  private updatePlanetName: () => Promise<string>;
  private updatePlanetNameInterval: NodeJS.Timeout | null = null;
  private highlightSprite: Phaser.GameObjects.Sprite;

  constructor(args: {
    id: Entity;
    scene: PrimodiumScene;
    coord: PixelCoord;
    empire: EEmpire;
    citadel?: boolean;
    updatePlanetName: () => Promise<string>;
    updateInterval?: number;
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

    this.planetName = new Phaser.GameObjects.Text(scene.phaserScene, coord.x, coord.y + 40, "", {
      fontSize: 25,
      color: "rgba(255,255,255,0.5)",
      fontFamily: "Silkscreen",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: { x: 10 },
    })
      .setOrigin(0.5, 0.5)
      .setAlpha(0.5)
      .setDepth(DepthLayers.Planet - 1);

    this.updatePlanetName = args.updatePlanetName;
    this.startUpdatePlanetNameInterval(args.updateInterval ?? 1000);

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

    this.iridium = new IconLabel(
      scene,
      {
        x: coord.x,
        y: coord.y + 60,
      },
      "0",
      "Iridium",
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

    this.magnets = allEmpires
      .slice(0, empireCount)
      .map((empire) => new Magnet(scene, coord.x + 75, coord.y - 60, empire, empireCount));
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

    this.treasurePlanetDecoration = new Phaser.GameObjects.Sprite(
      scene.phaserScene,
      coord.x,
      coord.y - 35,
      Assets.SpriteAtlas,
    )
      .setBlendMode(Phaser.BlendModes.NORMAL)
      .setDepth(DepthLayers.Planet + 1)
      .setActive(false)
      .setVisible(false);

    if (citadel) {
      this.citadelCrown = new Phaser.GameObjects.Sprite(scene.phaserScene, coord.x, coord.y - 75, Assets.SpriteAtlas)
        .setOrigin(0.5, 0.5)
        .setDepth(DepthLayers.Citadel)
        .play(Animations.CitadelCrown);

      this.citadelAsteroidBelt = new Phaser.GameObjects.Sprite(
        scene.phaserScene,
        coord.x,
        coord.y - 30,
        Assets.SpriteAtlas,
        Sprites.CitadelAsteroidBelt,
      ).setDepth(DepthLayers.Citadel);

      this.citadelShineInterval = setInterval(() => {
        this.citadelShine();
      }, 10_000);
    }

    this.shieldEater = new ShieldEater(scene, id, { x: this.planetSprite.x, y: this.planetSprite.y }).setDepth(
      DepthLayers.ShieldEater,
    );

    this.acidRain = new AcidRain(scene, id, { x: this.planetSprite.x, y: this.planetSprite.y }).setDepth(
      DepthLayers.AcidRain,
    );

    this.highlightSprite = this.scene.add
      .sprite(
        this.hexSprite.x,
        this.hexSprite.y,
        Assets.SpriteAtlas,
        Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"],
      )
      .setAlpha(1)
      .setScale(1.02)
      .setDepth(this.hexSprite.depth - 1)
      .setActive(false)
      .setVisible(false);

    this._scene = scene;
    this.id = id;
    this.coord = coord;
    this.empireId = empire;

    this._scene.objects.planet.add(id, this, false);
  }

  private async startUpdatePlanetNameInterval(interval: number) {
    // Clear any existing interval
    if (this.updatePlanetNameInterval) {
      clearInterval(this.updatePlanetNameInterval);
    }

    const update = async () => {
      const newName = await this.updatePlanetName();
      this.planetName.setText(newName);
    };
    update();
    this.updatePlanetNameInterval = setInterval(update, interval);
  }

  getEmpire() {
    return this.empireId;
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
    this.scene.add.existing(this.iridium);
    if (this.citadelCrown) this.scene.add.existing(this.citadelCrown);
    if (this.citadelAsteroidBelt) this.scene.add.existing(this.citadelAsteroidBelt);
    this.magnets.forEach((magnet) => this.scene.add.existing(magnet));
    this.scene.add.existing(this.magnetWaves);
    this.scene.add.existing(this.acidRain);
    this.scene.add.existing(this.treasurePlanetDecoration);
    this.scene.add.existing(this.highlightSprite);
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
    this.iridium.setScale(scale);
    if (this.citadelCrown) this.citadelCrown.setScale(scale);
    if (this.citadelAsteroidBelt) this.citadelAsteroidBelt.setScale(scale);
    this.magnets.forEach((magnet) => magnet.setScale(scale));
    this.magnetWaves.setScale(scale);
    this.shieldEater.setScale(scale);
    this.acidRain.setScale(scale);
    this.treasurePlanetDecoration.setScale(scale);
    this.highlightSprite.setScale(scale * 1.02);
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
      0.8,
      0,
    );

    this.shields.setAlpha(alpha);
    this.ships.setAlpha(alpha);
    this.iridium.setAlpha(alpha);
    this.magnets.forEach((magnet) => magnet.setAlpha(alpha));
    this.planetName.setAlpha(nameAlpha);
  }

  highlightHex(highlight: boolean) {
    if (highlight) {
      this.highlightSprite.setActive(true).setVisible(true);
      this.scene.tweens.add({
        targets: this.highlightSprite,
        alpha: { from: 0, to: 1 },
        repeat: -1,
        yoyo: true,
        duration: 1000,
        ease: "Sine.easeInOut",
      });
    } else {
      if (this.highlightSprite) {
        this.scene.tweens.killTweensOf(this.highlightSprite);
        this.highlightSprite.setActive(false).setVisible(false);
      }
    }
  }

  // - if originEmpire === this.empireId, do nothing (just moving ships)
  // - if originEmpire !== this.empireId, trigger the battle
  // - if destinationEmpire !== this.empireId, also update the faction
  triggerBattle(originEmpire: EEmpire, destinationEmpire: EEmpire, conquered: boolean, playAnims = true) {
    if (originEmpire === this.empireId) return;

    if (!this.playAnims || !playAnims) {
      if (conquered) this.updateFaction(originEmpire);
      return;
    }

    this._scene.audio.play("Blaster", "sfx");
    this._scene.fx.flashTint(this.planetSprite, { repeat: conquered ? 2 : 3 });
    this._scene.fx.emitVfx({ x: this.coord.x, y: this.coord.y - 60 }, "Combat", {
      depth: DepthLayers.Marker,
      blendMode: Phaser.BlendModes.ADD,
      onFrameChange: (frame) => {
        if (frame !== 11) return;
        if (conquered) this.updateFaction(originEmpire);
      },
    });
  }

  updateFaction(empire: EEmpire) {
    if (empire === this.empireId) return;

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

    this.hexSprite.setTexture(Assets.SpriteAtlas, Sprites[EmpireToHexSpriteKeys[empire] ?? "HexGrey"]);
    this.empireId = empire;
  }

  setPendingMove(destinationPlanetId: Entity, playAnims = true) {
    const destinationPlanet = this._scene.objects.planet.get(destinationPlanetId);
    if (!destinationPlanet) return;

    if (!!this.playAnims || !playAnims) {
      this.pendingMove = destinationPlanetId;
      return;
    }

    const angle = calculateAngleBetweenPoints(this.coord, destinationPlanet.coord);

    this.pendingArrow.setRotation(angle.radian);

    this.pendingArrow.setVisible(true).setActive(true);
    (this.pendingArrow.getAt(0) as Phaser.GameObjects.Sprite).play(
      Animations[EmpireToPendingAnimationKeys[this.empireId] ?? "PendingBlue"],
    );
  }

  removePendingMove() {
    this.pendingArrow.setVisible(false).setActive(false);
    this.pendingMove = null;
  }

  moveDestroyers(destinationPlanetId: Entity, playAnims = true) {
    if (!this.playAnims || !playAnims) return;

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
    if (!this.playAnims) return;
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

  setIridiumCount(count: bigint) {
    this.iridium.setText(
      formatNumber(count, {
        short: true,
        showZero: true,
        fractionDigits: 2,
      }),
    );

    if (count >= TREASURE_PLANET_IRIDIUM_THRESHOLD) {
      this.treasurePlanetDecoration.setVisible(true).setActive(true);
      this.treasurePlanetDecoration.play(Animations.TreasurePlanet);
    } else {
      this.treasurePlanetDecoration.setVisible(false).setActive(false);
    }
  }

  setMagnet(empire: EEmpire, turns: number, playAnims = true) {
    if (!this.playAnims || !playAnims) {
      this.activeMagnets.set(empire, turns);
      return;
    }

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
    return this.shieldEater.setShieldEaterLocation(present, this.playAnims);
  }

  setShieldEaterPath(turns: number, turnsToDestination?: number): ShieldEater["path"] {
    return this.shieldEater.setShieldEaterPath(turns, turnsToDestination);
  }

  shieldEaterDetonate(): ShieldEater {
    return this.shieldEater.shieldEaterDetonate();
  }

  shieldEaterCrack(direction: EDirection): ShieldEater {
    return this.shieldEater.shieldEaterCrack(direction);
  }

  citadelShine(): void {
    this.citadelCrown?.play(Animations.CitadelCrown);
    this._scene.fx.emitVfx({ x: this.coord.x, y: this.coord.y - 25 }, "CitadelShine", {
      depth: DepthLayers.Planet + 1,
      blendMode: Phaser.BlendModes.ADD,
    });
  }

  setAcid(cycles: number, expiring: boolean) {
    this.acidRain.setAcid(cycles, expiring, this.playAnims);
  }

  setPlayAnims(playAnims: boolean) {
    this.playAnims = playAnims;

    // render the latest pending actions if there are any
    if (playAnims) {
      if (this.pendingMove) {
        this.setPendingMove(this.pendingMove);
        this.pendingMove = null;
      }

      this.activeMagnets.forEach((turns, empire) => {
        this.setMagnet(empire, turns);
      });
    }
  }

  override destroy() {
    this.pendingArrow.destroy();
    this.planetSprite.destroy();
    this.planetUnderglowSprite.destroy();
    this.hexSprite.destroy();
    this.hexHoloSprite.destroy();
    this.citadelCrown?.destroy();
    this.citadelAsteroidBelt?.destroy();
    if (this.citadelShineInterval) clearInterval(this.citadelShineInterval);
    this._scene.objects.planet.remove(this.id);
    this.magnets.forEach((magnet) => magnet.destroy());
    this.magnetWaves.destroy();
    if (this.updatePlanetNameInterval) {
      clearInterval(this.updatePlanetNameInterval);
      this.updatePlanetNameInterval = null;
    }
    this.highlightSprite.destroy();

    super.destroy();
  }
}
