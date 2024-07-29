import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";

export const renderRoutines = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.BuyShieldsNPCAction.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Complete2", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `-${current.goldSpent}`,
          {
            icon: "Gold",
            color: "#ff0000",
          }
        );

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 25 },
          `+${current.shieldBought}`,
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

  tables.BuyShipsNPCAction.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Complete2", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `-${current.goldSpent}`,
          {
            icon: "Gold",
            color: "#ff0000",
          }
        );

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `+${current.shipBought}`,
          {
            icon: "Ship",
            delay: 500,
          }
        );
      },
    },
    { runOnInit: false }
  );
};
