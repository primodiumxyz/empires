import { EEmpire } from "@primodiumxyz/contracts";
import { convertAxialToCartesian, Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { Planet } from "@game/lib/objects/Planet";
import { PrimodiumScene } from "@game/types";

const MARGIN = 10;

export const renderPlanets = (scene: PrimodiumScene, core: Core) => {
  const { tables } = core;
  const systemsWorld = namespaceWorld(core.network.world, "systems");

  tables.Planet.getAll().forEach(async (entity) => {
    const planet = tables.Planet.get(entity);

    if (!planet) return;

    const { q, r } = planet;

    const planetObj = new Planet({
      id: entity,
      scene,
      coord: convertAxialToCartesian({ q: Number(q) - 100, r: Number(r) }, 100 + MARGIN),
      empire: planet.empireId,
      citadel: planet.isCitadel,
      empireCount: tables.P_GameConfig.get()?.empireCount ?? 0,
      updatePlanetName: async () => core.utils.generatePlanetName(entity),
    });

    planetObj
      .onClick((pointer: Phaser.Input.Pointer) => {
        // TODO: vv this is madness, fix this cleanly (click on trading view chart propagating to below)
        if (
          (pointer.event.srcElement as HTMLElement)?.parentElement?.parentElement?.parentElement?.parentElement
            ?.parentElement?.className === "tv-lightweight-charts"
        )
          return;
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

  const highlightNextTurnPlanets = (empireTurn: EEmpire) => {
    const empireCount = tables.P_GameConfig.get()?.empireCount ?? 1;
    const prevEmpireTurn = (empireTurn - 1 === 0 ? empireCount : empireTurn - 1) as EEmpire;

    const empireTurnPlanets = tables.Planet.getAllWith({ empireId: empireTurn });
    const prevEmpireTurnPlanets = tables.Planet.getAllWith({ empireId: prevEmpireTurn });

    empireTurnPlanets.forEach((planetId) => {
      const planet = scene.objects.planet.get(planetId);
      if (!planet) return;
      planet.highlightHex(true);
    });

    prevEmpireTurnPlanets.forEach((planetId) => {
      const planet = scene.objects.planet.get(planetId);
      if (!planet) return;
      planet.highlightHex(false);
    });
  };

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
        planet.setIridiumCount(current?.goldCount ?? 0n);
      }
    },
  });

  tables.Turn.watch({
    world: systemsWorld,
    onChange: ({ properties: { current } }) => {
      if (!current) return;
      highlightNextTurnPlanets(current.empire);
    },
  });

  // Reset empires on game reset
  tables.P_GameConfig.watch({
    world: systemsWorld,
    onChange: ({ properties: { current, prev } }) => {
      if (current?.gameOverBlock !== prev?.gameOverBlock) {
        tables.Planet.getAll().forEach((entity) => {
          const planet = scene.objects.planet.get(entity);
          const planetData = tables.Planet.get(entity);
          if (!planet || !planetData) return;
          planet.updateFaction(planetData.empireId);
          planet.setMagnet(planetData.empireId, 0);
          planet.setAcid(0, false);
        });
      }
    },
  });
};
