import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

export const renderOverrideFloatingText = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
    utils: { getAllNeighbors },
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
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 25 }, `+${current.overrideCount}`, {
          icon: "Shield",
          delay: 500,
        });
      },
    },
    {
      runOnInit: false,
    },
  );

  tables.CreateShipOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.overrideCount}`, {
          icon: "Ship",
          delay: 500,
        });
      },
    },
    { runOnInit: false },
  );

  tables.BoostChargeOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Build", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.boostCount}`, {
          icon: "Boost",
          delay: 500,
          color: "#ff0000",
        });
      },
    },
    { runOnInit: false },
  );

  tables.DrainShieldsOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${current.overrideCount}`, {
          icon: "Shield",
          color: "#ff0000",
        });
      },
    },
    { runOnInit: false },
  );

  tables.KillShipOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${current.overrideCount}`, {
          icon: "Ship",
          color: "#ff0000",
        });
      },
    },
    { runOnInit: false },
  );

  tables.StunChargeOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${current.stunCount}`, {
          icon: "Stun",
          delay: 500,
        });
      },
    },
    { runOnInit: false },
  );

  tables.TacticalStrikeOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);

        if (!planet) return;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });
        scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `ALL SHIPS DESTROYED`, {
          icon: "Ship",
          color: "#ff0000",
        });
      },
    },
    { runOnInit: false },
  );

  const getPrevShieldCount = (planetId: Entity, detonateDamage: bigint) => {
    const currentShieldCount = tables.Planet.get(planetId)?.shieldCount ?? 0n;
    if (detonateDamage === 10_000n) return undefined;

    const originalShieldCount = (currentShieldCount * 10_000n) / (10_000n - detonateDamage);
    return originalShieldCount - currentShieldCount;
  };

  tables.ShieldEaterDetonateOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const planet = scene.objects.planet.get(current.planetId as Entity);
        if (!planet) return;
        const neighborPlanets = getAllNeighbors(current.planetId as Entity).map((entity) =>
          scene.objects.planet.get(entity),
        );
        console.log({ planet, neighborPlanets });

        const shieldEaterConfig = tables.P_ShieldEaterConfig.get();
        const detonateCenterDamage = shieldEaterConfig?.detonateCenterDamage ?? 0n;
        const detonateAdjacentDamage = shieldEaterConfig?.detonateAdjacentDamage ?? 0n;

        scene.audio.play("Demolish", "sfx", { volume: 0.25 });

        if (detonateCenterDamage === 10_000n) {
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `ALL SHIELDS DESTROYED`, {
            icon: "Shield",
            color: "#ff0000",
          });
        } else {
          const shieldsDestroyed = getPrevShieldCount(current.planetId as Entity, detonateCenterDamage);
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${shieldsDestroyed}`, {
            icon: "Shield",
            color: "#ff0000",
          });
        }

        neighborPlanets.forEach((planet) => {
          console.log({ planet });
          if (!planet) return;

          const shieldsDestroyed = getPrevShieldCount(planet.id, detonateAdjacentDamage);
          console.log({ planet, shieldsDestroyed });
          if (shieldsDestroyed)
            scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${shieldsDestroyed}`, {
              icon: "Shield",
              color: "#ff0000",
            });
        });
      },
    },
    { runOnInit: false },
  );
};
