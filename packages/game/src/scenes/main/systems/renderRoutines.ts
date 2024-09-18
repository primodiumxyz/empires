import { EEmpire } from "@primodiumxyz/contracts";
import { Core, formatNumber, sleep } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { DepthLayers } from "@game/lib/constants/common";
import { EmpireToPlanetSpriteKeys } from "@game/lib/mappings";
import { StaggerQueue } from "@game/lib/utils/createStaggerQueue";
import { PrimodiumScene } from "@game/types";

export const renderRoutines = (scene: PrimodiumScene, core: Core, { enqueue }: StaggerQueue) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.BuyShieldsRoutineLog.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Complete2", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `-${current.goldSpent}`, {
            icon: "Iridium",
            color: "#ff0000",
          });

          scene.audio.play("Build", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `+${current.shieldBought}`, {
            icon: "Shield",
            fontSize: 16,
            iconSize: 20,
            borderStyle: {
              width: 2,
              color: 0x00ff00,
              alpha: 0.75,
            },
            delay: 500,
          });
        }, 500);
      },
    },
    {
      runOnInit: false,
    },
  );

  tables.BuyShipsRoutineLog.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Complete2", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `-${current.goldSpent}`, {
            icon: "Iridium",
            color: "#ff0000",
          });

          scene.audio.play("Build", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `+${current.shipBought}`, {
            icon: "Ship",
            delay: 500,
            fontSize: 16,
            iconSize: 20,
            borderStyle: {
              width: 2,
              color: 0x00ff00,
              alpha: 0.75,
            },
          });
        }, 500);
      },
    },
    { runOnInit: false },
  );

  tables.MoveRoutineLog.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.originPlanetId as Entity);
        const destinationPlanet = scene.objects.planet.get(current.destinationPlanetId as Entity);

        if (!planet || !destinationPlanet) return;

        planet.setPendingMove(current.destinationPlanetId as Entity);
        enqueue(async () => {
          planet.removePendingMove();
          //move destroyers
          planet.moveDestroyers(current.destinationPlanetId as Entity);

          scene.fx.emitFloatingText(
            { x: destinationPlanet.coord.x, y: destinationPlanet.coord.y - 40 },
            `${current.shipCount.toLocaleString()} Arrived`,
            {
              icon: "Ship",
              iconSize: 20,
              fontSize: 16,
              delay: 375,
              borderStyle: {
                color: 0x800080,
                alpha: 0.75,
                width: 1,
              },
            },
          );

          await sleep(375);

          // trigger battle and update factions if it changed
          const originEmpire = tables.Planet.get(current.originPlanetId as Entity)?.empireId ?? EEmpire.NULL;
          const destinationEmpire = tables.Planet.get(current.destinationPlanetId as Entity)?.empireId ?? EEmpire.NULL;
          if (destinationPlanet) {
            destinationPlanet.triggerBattle(
              originEmpire,
              destinationEmpire,
              current.conquered,
              Object.values(scene.tables.GameState.get() ?? {}).every(Boolean),
            );

            if (destinationEmpire && destinationEmpire !== destinationPlanet.getEmpire()) {
              scene.fx.emitFloatingText(
                { x: destinationPlanet.coord.x, y: destinationPlanet.coord.y - 50 },
                "planet captured",
                {
                  icon: EmpireToPlanetSpriteKeys[destinationEmpire as EEmpire],
                  iconSize: 20,
                  fontSize: 16,
                  delay: 1375,
                  borderStyle: {
                    color: 0x800080,
                    alpha: 0.75,
                    width: 1,
                  },
                },
              );
            }
          }
        }, 250);
      },
    },
    { runOnInit: false },
  );

  tables.AccumulateGoldRoutineLog.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(async () => {
          scene.audio.play("Complete2", "sfx", { volume: 0.15 });

          scene.fx.emitVfx({ x: planet.coord.x + 5, y: planet.coord.y - 45 }, "AddIridium", {
            depth: DepthLayers.Marker,
            blendMode: Phaser.BlendModes.NORMAL,
          });

          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `+${current.goldAdded}`, {
            icon: "Iridium",
            fontSize: 16,
            iconSize: 20,
            delay: 1000,
            borderStyle: {
              alpha: 0.75,
              width: 2,
              color: 0xffd700,
            },
          });
        }, 50);
      },
    },
    { runOnInit: false },
  );

  tables.Turn.watch(
    {
      world: systemsWorld,
      onUpdate: async ({ properties: { prev } }) => {
        if (!prev) return;

        const config = tables.P_GameConfig.get();
        const goldGenRate = config?.goldGenRate;
        const empireCount = config?.empireCount;

        const planets = tables.Planet.getAllWith({ empireId: prev.empire });

        for (let i = 0; i < planets.length; i++) {
          const planet = scene.objects.planet.get(planets[i] as Entity);

          if (!planet || !goldGenRate || !empireCount) continue;

          enqueue(() => {
            scene.audio.play("Complete", "sfx", {
              volume: 0.01,
              detune: 20 * i,
            });
            scene.fx.emitFloatingText(
              { x: planet.coord.x, y: planet.coord.y - 25 },
              `+${formatNumber(goldGenRate * BigInt(empireCount))}`,
              {
                icon: "Iridium",
                fontSize: 12,
                iconSize: 16,
              },
            );
          }, 50);
        }
      },
    },
    { runOnInit: false },
  );
};
