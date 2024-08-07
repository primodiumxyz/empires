import { EEmpire } from "@primodiumxyz/contracts";
import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
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

  const updateMagnetForEmpire = (empire: EEmpire, currTurn: bigint) => {
    for (const planet of planets) {
      const magnet = tables.Magnet.getWithKeys({
        empireId: empire,
        planetId: planet,
      });

      const turnsLeft = calculateTurnsLeft(magnet?.endTurn, currTurn);
      scene.objects.planet.get(planet)?.setMagnet(empire, turnsLeft);
    }
  };

  tables.Turn.watch({
    world: systemsWorld,
    onChange: ({ properties: { current } }) => {
      const currTurn = current?.value ?? 1n;

      updateMagnetForEmpire(EEmpire.Red, currTurn);
      updateMagnetForEmpire(EEmpire.Blue, currTurn);
      updateMagnetForEmpire(EEmpire.Green, currTurn);
    },
  });

  tables.Magnet.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current, prev } }) => {
      if (!current) {
        // we might have just removed some magnet with cheatcodes
        if (prev) {
          const { planetId, empireId } = decodeEntity(tables.Magnet.metadata.abiKeySchema, entity);
          scene.objects.planet.get(planetId as Entity)?.setMagnet(empireId, 0);
        }

        return;
      }

      const { planetId, empireId } = decodeEntity(tables.Magnet.metadata.abiKeySchema, entity);
      const planet = scene.objects.planet.get(planetId as Entity);
      if (!planet) return;

      const currTurn = tables.Turn.get()?.value ?? 1n;
      const turnsLeft = calculateTurnsLeft(current.endTurn, currTurn);

      planet.setMagnet(empireId, turnsLeft);
    },
  });
};
