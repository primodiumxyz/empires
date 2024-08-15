import { Core } from "@primodiumxyz/core";
import { namespaceWorld } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

export const renderOverrideFloatingText = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  tables.Planet.watch(
    {
      world: systemsWorld,
      onEnter: ({ entity, properties: { current, prev } }) => {
        if (!current || !prev) return;

        const planet = scene.objects.planet.get(entity);
        if (!planet) return;

        // ships
        if (current.shipCount < prev.shipCount) {
          const diff = prev.shipCount - current.shipCount;
          scene.audio.play("Demolish", "sfx", { volume: 0.25 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 20 },
            current.shipCount === 0n ? `ALL SHIPS DESTROYED` : `-${diff}`,
            {
              icon: "Ship",
              color: "#ff0000",
            },
          );
        } else if (current.shipCount > prev.shipCount) {
          const diff = current.shipCount - prev.shipCount;
          scene.audio.play("Build", "sfx", { volume: 0.25 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `+${diff}`, {
            icon: "Ship",
            delay: 500,
          });
        }

        // shields
        if (current.shieldCount < prev.shieldCount) {
          const diff = prev.shieldCount - current.shieldCount;
          scene.audio.play("Demolish", "sfx", { volume: 0.25 });
          scene.fx.emitFloatingText(
            { x: planet.coord.x, y: planet.coord.y - 20 },
            current.shieldCount === 0n ? `ALL SHIELDS DESTROYED` : `-${diff}`,
            {
              icon: "Shield",
              color: "#ff0000",
              delay: 500,
            },
          );
        } else if (current.shieldCount > prev.shieldCount) {
          const diff = current.shieldCount - prev.shieldCount;
          scene.audio.play("Build", "sfx", { volume: 0.25 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `+${diff}`, {
            icon: "Shield",
            delay: 500,
          });
        }
      },
    },
    { runOnInit: false },
  );

  // tables.BoostChargeOverrideLog.watch(
  //   {
  //     world: systemsWorld,
  //     onEnter: ({ properties: { current } }) => {
  //       if (!current) return;

  //       const planet = scene.objects.planet.get(current.planetId as Entity);

  //       if (!planet) return;

  //       scene.audio.play("Build", "sfx", { volume: 0.25 });
  //       scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.boostCount}`, {
  //         icon: "Boost",
  //         delay: 500,
  //         color: "#ff0000",
  //       });
  //     },
  //   },
  //   { runOnInit: false },
  // );

  // tables.StunChargeOverrideLog.watch(
  //   {
  //     world: systemsWorld,
  //     onEnter: ({ properties: { current } }) => {
  //       if (!current) return;

  //       const planet = scene.objects.planet.get(current.planetId as Entity);

  //       if (!planet) return;

  //       scene.audio.play("Demolish", "sfx", { volume: 0.25 });
  //       scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${current.stunCount}`, {
  //         icon: "Stun",
  //         delay: 500,
  //       });
  //     },
  //   },
  //   { runOnInit: false },
  // );

  // tables.TacticalStrikeOverrideLog.watch(
  //   {
  //     world: systemsWorld,
  //     onEnter: ({ properties: { current } }) => {
  //       if (!current) return;

  //       const planet = scene.objects.planet.get(current.planetId as Entity);

  //       if (!planet) return;

  //       scene.audio.play("Demolish", "sfx", { volume: 0.25 });
  //       scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `ALL SHIPS DESTROYED`, {
  //         icon: "Ship",
  //         color: "#ff0000",
  //       });
  //     },
  //   },
  //   { runOnInit: false },
  // );
};
