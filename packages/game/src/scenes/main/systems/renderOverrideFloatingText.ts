import { EShieldEaterDamageType } from "@primodiumxyz/contracts";
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

        const visible = !!scene.tables.GameState.get()?.visible;
        enqueue(() => {
          scene.audio.play("Build", "sfx", { volume: visible ? 0.25 : 0 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.overrideCount}`, {
            icon: "Ship",
            skip: !visible,
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

        const visible = !!scene.tables.GameState.get()?.visible;
        enqueue(() => {
          scene.audio.play("Build", "sfx", { volume: visible ? 0.25 : 0 });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `+${current.shieldBought}`, {
            icon: "Shield",
            skip: !visible,
          });
        }, 50);
      },
    },
    { runOnInit: false },
  );

  const shieldsDestroyed = (planetId: Entity, shieldsDestroyed: bigint, delay?: number) => {
    const planet = scene.objects.planet.get(planetId);
    if (!planet) return;

    const visible = !!scene.tables.GameState.get()?.visible;
    enqueue(() => {
      scene.audio.play("Demolish", "sfx", { volume: visible ? 0.25 : 0, delay: delay ?? 500 });
      scene.fx.emitFloatingText(
        { x: planet.coord.x, y: planet.coord.y - 20 },
        `-${shieldsDestroyed.toLocaleString()}`,
        {
          icon: "Shield",
          color: "#ff0000",
          // blue background
          fillStyle: {
            color: 0x112344,
            alpha: 0.75,
          },
          delay: delay ?? 500,
          skip: !visible,
        },
      );
    }, 50);
  };

  tables.ShieldEaterDamageOverrideLog.watch(
    {
      world: systemsWorld,
      onEnter: ({ properties: { current } }) => {
        if (!current) return;

        const delay =
          current.damageType === EShieldEaterDamageType.Eat
            ? // delay until shield eater bites planet
              3000
            : current.damageType === EShieldEaterDamageType.Detonate
              ? 1000
              : // EShieldEaterDamageType.Collateral
                1200;

        shieldsDestroyed(current.planetId as Entity, current.shieldsDestroyed, delay);
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

        const visible = !!scene.tables.GameState.get()?.visible;
        enqueue(() => {
          const delay = 500;
          scene.audio.play("Demolish", "sfx", { volume: visible ? 0.25 : 0, delay });
          scene.fx.emitFloatingText({ x: planet.coord.x, y: planet.coord.y - 20 }, `-${current.shipsDestroyed}`, {
            icon: "Ship",
            color: "#ff0000",
            // green background
            fillStyle: {
              color: 0x114411,
              alpha: 0.75,
            },
            delay,
            skip: !visible,
          });
        }, 50);
      },
    },
    { runOnInit: false },
  );
};
