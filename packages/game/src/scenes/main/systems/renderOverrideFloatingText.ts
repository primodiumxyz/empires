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

  const shieldsDestroyed = (planetId: Entity, shieldsDestroyed: bigint, delay?: number) => {
    const planet = scene.objects.planet.get(planetId);
    if (!planet) return;

    enqueue(() => {
      scene.audio.play("Demolish", "sfx", { volume: 0.25, delay: delay ?? 500 });
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
};
