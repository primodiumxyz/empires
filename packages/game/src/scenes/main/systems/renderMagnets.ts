import { EEmpire } from "@primodiumxyz/contracts";
import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
import { allEmpires } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

const calculateTurnsLeft = (endTurn: bigint | undefined, currTurn: bigint) => {
  if (endTurn === undefined) return 0;
  return Number(endTurn - currTurn);
};

export const renderMagnets = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");
  const planets = tables.Planet.getAll();

  const updateMagnetForEmpire = (empire: EEmpire, currTurn: bigint, visible: boolean) => {
    for (const planet of planets) {
      const magnet = tables.Magnet.getWithKeys({
        empireId: empire,
        planetId: planet,
      });

      const turnsLeft = calculateTurnsLeft(magnet?.endTurn, currTurn);
      scene.objects.planet.get(planet)?.setMagnet(empire, turnsLeft, visible);
    }
  };

  tables.Turn.watch(
    {
      world: systemsWorld,
      onChange: ({ properties: { current } }) => {
        const visible = !!scene.tables.GameState.get()?.visible;
        const currTurn = current?.value ?? 1n;
        const empireCount = tables.P_GameConfig.get()?.empireCount ?? 0;

        allEmpires.slice(0, empireCount).forEach((empire) => {
          updateMagnetForEmpire(empire, currTurn, visible);
        });
      },
    },
    { runOnInit: false },
  );

  tables.Magnet.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current, prev } }) => {
      const visible = !!scene.tables.GameState.get()?.visible;
      if (!current) {
        // we might have just removed some magnet with cheatcodes
        if (prev) {
          const { planetId, empireId } = decodeEntity(tables.Magnet.metadata.abiKeySchema, entity);
          scene.objects.planet.get(planetId as Entity)?.setMagnet(empireId, 0, visible);
        }

        return;
      }

      const { planetId, empireId } = decodeEntity(tables.Magnet.metadata.abiKeySchema, entity);
      const planet = scene.objects.planet.get(planetId as Entity);
      if (!planet) return;

      const currTurn = tables.Turn.get()?.value ?? 1n;
      const turnsLeft = calculateTurnsLeft(current.endTurn, currTurn);

      planet.setMagnet(empireId, turnsLeft, visible);
    },
  });
};
