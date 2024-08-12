import { convertAxialToCartesian, Core, entityToPlanetName } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { Planet } from "@game/lib/objects/Planet";
import { PrimodiumScene } from "@game/types";

const MARGIN = 10;

export const renderPlanets = (scene: PrimodiumScene, core: Core) => {
  const { tables } = core;
  const systemsWorld = namespaceWorld(core.network.world, "systems");

  tables.Planet.getAll().forEach((entity) => {
    const planet = tables.Planet.get(entity);

    if (!planet) return;

    const { q, r } = planet;

    if (planet.isCitadel) {
      console.log({ planet: entityToPlanetName(entity) });
    }
    const planetObj = new Planet({
      id: entity,
      scene,
      coord: convertAxialToCartesian({ q: Number(q) - 100, r: Number(r) }, 100 + MARGIN),
      empire: planet.empireId,
      citadel: planet.isCitadel,
    });

    planetObj
      .onClick(() => {
        if (tables.SelectedPlanet.get()?.value === entity) {
          tables.SelectedPlanet.remove();
          return;
        }

        if (tables.SelectedPlanet.get()?.value) {
          tables.SelectedPlanet.remove();
        }

        tables.SelectedPlanet.set({ value: entity });
        planetObj.flashPlanet();
        scene.audio.play("Click2", "ui");
      })
      .onHoverEnter(() => {
        tables.HoveredPlanet.set({ value: entity });
      })
      .onHoverExit(() => {
        tables.HoveredPlanet.remove();
      });
  });

  function scaleUp(planetId: Entity) {
    const hoveredPlanet = scene.objects.planet.get(planetId);
    if (!hoveredPlanet) return;

    // Destroy existing tweens for this planet
    scene.phaserScene.tweens.killTweensOf(hoveredPlanet);

    scene.phaserScene.add
      .tween({
        targets: hoveredPlanet,
        scale: 1.1,
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          hoveredPlanet.setScale(tween.getValue());
        },
        ease: Phaser.Math.Easing.Quadratic.Out,
        duration: 250,
      })
      .play();
  }

  function scaleDown(planetId: Entity) {
    const hoveredPlanet = scene.objects.planet.get(planetId);
    if (!hoveredPlanet) return;

    // Destroy existing tweens for this planet
    scene.phaserScene.tweens.killTweensOf(hoveredPlanet);

    scene.phaserScene.add
      .tween({
        targets: hoveredPlanet,
        scale: 1,
        onUpdate: (tween: Phaser.Tweens.Tween) => {
          hoveredPlanet.setScale(tween.getValue());
        },
        ease: Phaser.Math.Easing.Quadratic.Out,
        duration: 250,
      })
      .play();
  }

  tables.HoveredPlanet.watch({
    world: systemsWorld,
    onChange: ({ properties: { current, prev } }) => {
      if (current?.value) {
        scaleUp(current.value);
      }

      if (prev?.value) {
        scaleDown(prev.value);
      }
    },
  });

  tables.Planet.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current } }) => {
      const planet = scene.objects.planet.get(entity);
      if (planet) {
        planet.setShieldCount(current?.shieldCount ?? 0n);
        planet.setShipCount(current?.shipCount ?? 0n);
        planet.setGoldCount(current?.goldCount ?? 0n);
      }
    },
  });
};
