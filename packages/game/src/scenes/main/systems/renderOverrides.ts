import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";

export const renderOverrides = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.ChargeShieldsOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 25 },
          `+${current.overrideCount}`,
          {
            icon: "Shield",
            delay: 500,
          }
        );
      },
    },
    {
      runOnInit: false,
    }
  );

  tables.CreateShipOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `+${current.overrideCount}`,
          {
            icon: "Ship",
            delay: 500,
          }
        );
      },
    },
    { runOnInit: false }
  );

  tables.DrainShieldsOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `-${current.overrideCount}`,
          {
            icon: "Shield",
            color: "#ff0000",
          }
        );
      },
    },
    { runOnInit: false }
  );

  tables.KillShipOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `-${current.overrideCount}`,
          {
            icon: "Ship",
            color: "#ff0000",
          }
        );
      },
    },
    { runOnInit: false }
  );
};
