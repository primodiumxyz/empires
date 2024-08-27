import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { StaggerQueue } from "@game/lib/utils/createStaggerQueue";
import { PrimodiumScene } from "@game/types";

export const renderOverrideFloatingText = (scene: PrimodiumScene, core: Core, { enqueue }: StaggerQueue) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.CreateShipOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Build", "sfx", { volume: 0.25 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.overrideCount}`, {
            icon: "Ship",
          });
        }, 50);
      },
    },
    { runOnInit: false },
  );

  tables.BuyShieldsRoutineLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        enqueue(() => {
          scene.audio.play("Build", "sfx", { volume: 0.25 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.shieldBought}`, {
            icon: "Shield",
          });
        }, 50);
      },
    },
    { runOnInit: false },
  );

  tables.AcidDamageOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);
        if (!planet) return;

        enqueue(() => {
          const delay = 500;
          scene.audio.play("Demolish", "sfx", { volume: 0.25, delay });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${current.shipsDestroyed}`, {
            icon: "Ship",
            color: "#ff0000",
            // green background
            fillStyle: {
              color: 0x114411,
              alpha: 0.75,
            },
            delay,
          });
        }, 50);
      },
    },
    { runOnInit: false },
  );

  // TODO: shield eater minus shields on both planet detonated & surrounding planets
};
