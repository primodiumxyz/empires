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
      onEnter: ({ entity, properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 25 },
          `+ ${current.shieldBought}`
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
      onEnter: ({ entity, properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.fx.emitFloatingText(
          { x: planet.coord.x, y: planet.coord.y - 20 },
          `+ ${current.shipBought}`
        );
      },
    },
    { runOnInit: false }
  );
};
