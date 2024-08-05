import { Core } from '@primodiumxyz/core';
import { Entity, namespaceWorld } from '@primodiumxyz/reactive-tables';
import { decodeEntity } from '@primodiumxyz/reactive-tables/utils';
import { PrimodiumScene } from '@game/types';
import { EEmpire } from '@primodiumxyz/contracts';

const calculateTurnsLeft = (
  endTurn: bigint | undefined,
  globalTurn: bigint,
) => {
  if (endTurn === undefined) return 0;
  return Number(endTurn - globalTurn);
};

export const renderMagnets = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, 'systems');
  const planets = tables.Planet.getAll();

  const updateMagnetForEmpire = (empire: EEmpire, currFullTurn: bigint) => {
    for (const planet of planets) {
      const magnet = tables.Magnet.getWithKeys({
        empireId: empire,
        planetId: planet,
      });

      const turnsLeft = calculateTurnsLeft(magnet?.endTurn, currFullTurn);
      scene.objects.planet.get(planet)?.setMagnet(empire, turnsLeft);
    }
  };

  tables.Turn.watch({
    world: systemsWorld,
    onChange: ({ properties: { current } }) => {
      const currTurn = current?.value ?? 1n;
      const currFullTurn = (currTurn - 1n) / 3n + 1n;

      updateMagnetForEmpire(EEmpire.Red, currFullTurn);
      updateMagnetForEmpire(EEmpire.Blue, currFullTurn);
      updateMagnetForEmpire(EEmpire.Green, currFullTurn);
    },
  });

  tables.Magnet.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current, prev } }) => {
      if (!current) {
        // we might have just removed some magnet with cheatcodes
        if (prev) {
          const { planetId, empireId } = decodeEntity(
            tables.Magnet.metadata.abiKeySchema,
            entity,
          );
          scene.objects.planet.get(planetId as Entity)?.setMagnet(empireId, 0);
        }

        return;
      }

      const { planetId, empireId } = decodeEntity(
        tables.Magnet.metadata.abiKeySchema,
        entity,
      );
      const planet = scene.objects.planet.get(planetId as Entity);
      if (!planet) return;

      const currTurn = tables.Turn.get()?.value ?? 1n;
      const currFullTurn = (currTurn - 1n) / 3n + 1n;

      const turnsLeft = calculateTurnsLeft(current.endTurn, currFullTurn);

      planet.setMagnet(empireId, turnsLeft);
    },
  });
};
