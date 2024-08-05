import { createStaggerQueue } from "@game/lib/utils/createStaggerQueue";
import { PrimodiumScene } from "@game/types";
import { Core, formatNumber, sleep } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

export const renderRoutines = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");
  const { enqueue } = createStaggerQueue();

  tables.BuyShieldsRoutine.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Complete2", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 25 },
            `-${current.goldSpent}`,
            {
              icon: "Gold",
              color: "#ff0000",
            }
          );

          scene.audio.play("Build", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 25 },
            `+${current.shieldBought}`,
            {
              icon: "Shield",
              fontSize: 16,
              iconSize: 20,
              borderStyle: {
                width: 2,
                color: 0x00ff00,
                alpha: 0.75,
              },
              delay: 500,
            }
          );
        }, 1000);
      },
    },
    {
      runOnInit: false,
    }
  );

  tables.BuyShipsRoutine.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Complete2", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 25 },
            `-${current.goldSpent}`,
            {
              icon: "Gold",
              color: "#ff0000",
            }
          );

          scene.audio.play("Build", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 25 },
            `+${current.shipBought}`,
            {
              icon: "Ship",
              delay: 500,
              fontSize: 16,
              iconSize: 20,
              borderStyle: {
                width: 2,
                color: 0x00ff00,
                alpha: 0.75,
              },
            }
          );
        }, 1000);
      },
    },
    { runOnInit: false }
  );

  tables.MoveRoutine.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(
          current.originPlanetId as Entity
        );
        const destinationPlanet = scene.objects.planet.get(
          current.destinationPlanetId as Entity
        );

        if (!planet) return;

        enqueue(async () => {
          //move destroyers
          planet.moveDestroyers(current.destinationPlanetId as Entity);

          scene.fx.emitFloatingText(
            (destinationPlanet ?? planet).coord,
            `${current.shipCount.toLocaleString()} Arrived`,
            {
              icon: "Ship",
              iconSize: 20,
              fontSize: 16,
              delay: 750,
              borderStyle: {
                color: 0x800080,
                alpha: 0.75,
                width: 1,
              },
            }
          );

          await sleep(750);

          //update factions if it changed
          const faction = tables.Planet.get(
            current.destinationPlanetId as Entity
          )?.empireId;

          if (faction && destinationPlanet)
            destinationPlanet.updateFaction(faction);
        }, 2250);
      },
    },
    { runOnInit: false }
  );

  tables.AccumulateGoldRoutine.watch(
    {
      world: systemsWorld,
      onEnter: async ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Complete2", "sfx", { volume: 0.15 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 25 },
            `+${current.goldAdded}`,
            {
              icon: "Gold",
              fontSize: 16,
              iconSize: 20,
              borderStyle: {
                alpha: 0.75,
                width: 2,
                color: 0xffd700,
              },
            }
          );
        }, 1000);
      },
    },
    { runOnInit: false }
  );

  tables.Turn.watch(
    {
      world: systemsWorld,
      onUpdate: async ({ properties: { prev } }) => {
        if (!prev) return;

        const goldGenRate = tables.P_GameConfig.get()?.goldGenRate;

        const planets = tables.Planet.getAllWith({ empireId: prev.empire });

        for (let i = 0; i < planets.length; i++) {
          const planet = scene.objects.planet.get(planets[i] as Entity);

          if (!planet || !goldGenRate) continue;

          enqueue(() => {
            scene.audio.play("Complete", "sfx", {
              volume: 0.01,
              detune: 20 * i,
            });
            scene.fx.emitFloatingText(
              { x: planet.coord.x, y: planet.coord.y - 25 },
              `+${formatNumber(goldGenRate * 3n)}`,
              {
                icon: "Gold",
                fontSize: 12,
                iconSize: 16,
              }
            );
          }, 50);
        }
      },
    },
    { runOnInit: false }
  );
};
