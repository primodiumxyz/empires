import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
import { PrimodiumScene } from "@game/types";
import { EEmpire } from "@primodiumxyz/contracts";

const calculateTurnsLeft = (
  endTurn: bigint | undefined,
  globalTurn: bigint,
  beforeEmpire: boolean
) => {
  if (endTurn == undefined) return 0;
  const turnsLeft = Number(endTurn - globalTurn);
  return beforeEmpire ? turnsLeft + 1 : turnsLeft;
};

export const renderMagnets = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");
  const planets = tables.Planet.getAll();

  tables.Turn.watch({
    world: systemsWorld,
    onChange: ({ properties: { current } }) => {
      const currTurn = current?.value ?? 0n;
      const currFullTurn = (currTurn - 1n) / 3n;
      const turnModulo = Number(currTurn - 1n) % 3;

      for (const planet of planets) {
        const redMagnet = tables.Magnet.getWithKeys({
          empireId: EEmpire.Red,
          planetId: planet,
        });
        const blueMagnet = tables.Magnet.getWithKeys({
          empireId: EEmpire.Blue,
          planetId: planet,
        });
        const greenMagnet = tables.Magnet.getWithKeys({
          empireId: EEmpire.Green,
          planetId: planet,
        });

        if (!redMagnet && !blueMagnet && !greenMagnet) continue;

        const redTurnsLeft = calculateTurnsLeft(
          redMagnet?.endTurn,
          currFullTurn,
          turnModulo < EEmpire.Red
        );
        const blueTurnsLeft = calculateTurnsLeft(
          blueMagnet?.endTurn,
          currFullTurn,
          turnModulo < EEmpire.Blue
        );
        const greenTurnsLeft = calculateTurnsLeft(
          greenMagnet?.endTurn,
          currFullTurn,
          turnModulo < EEmpire.Green
        );

        scene.objects.planet
          .get(planet)
          ?.setMagnet(EEmpire.Red, redTurnsLeft)
          .setMagnet(EEmpire.Blue, blueTurnsLeft)
          .setMagnet(EEmpire.Green, greenTurnsLeft);
      }
    },
  });

  tables.Magnet.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current } }) => {
      if (!current) return;

      console.log(entity);

      const { planetId, empireId } = decodeEntity(
        tables.Magnet.metadata.abiKeySchema,
        entity
      );
      const planet = scene.objects.planet.get(planetId as Entity);
      if (!planet) return;

      const currTurn = tables.Turn.get()?.value ?? 0n;
      const currFullTurn = (currTurn - 1n) / 3n;
      const turnModulo = Number(currTurn - 1n) % 3;

      const turnsLeft = calculateTurnsLeft(
        current.endTurn,
        currFullTurn,
        turnModulo < empireId
      );

      planet.setMagnet(empireId, turnsLeft);
    },
  });
};
