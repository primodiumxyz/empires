import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";

export const renderOverrides = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.ChargeShieldsPlayerAction.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 25 },
          `+${current.actionCount}`,
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

  tables.CreateShipPlayerAction.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `+${current.actionCount}`,
          {
            icon: "Ship",
            delay: 500,
          }
        );
      },
    },
    { runOnInit: false }
  );

  tables.DrainShieldsPlayerAction.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `-${current.actionCount}`,
          {
            icon: "Shield",
            color: "#ff0000",
          }
        );
      },
    },
    { runOnInit: false }
  );

  tables.KillShipPlayerAction.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `-${current.actionCount}`,
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
