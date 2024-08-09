import { Core } from "@primodiumxyz/core";
import { namespaceWorld, Properties } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

export const renderOverheat = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");
  const planets = tables.Planet.getAll();
  const maxCharge = tables.P_TacticalStrikeConfig.get()?.maxCharge ?? 0n;

  const getChargeRatio = (
    blockNumber: bigint,
    tacticalStrikeData: Properties<(typeof tables.Planet_TacticalStrike)["propertiesSchema"]>,
  ) => {
    const blocksElapsed = blockNumber - tacticalStrikeData.lastUpdated;
    const chargeProgress = tacticalStrikeData.charge + (blocksElapsed * tacticalStrikeData.chargeRate) / 100n;
    return Number(chargeProgress) / Number(maxCharge);
  };

  tables.BlockNumber.watch(
    {
      world: systemsWorld,
      onChange: ({ properties: { current } }) => {
        const blockNumber = current?.value ?? 0n;
        for (const planet of planets) {
          const planetTacticalStrikeData = tables.Planet_TacticalStrike.getWithKeys({ planetId: planet });
          if (!planetTacticalStrikeData) continue;

          scene.objects.planet.get(planet)?.setOverheatProgress(getChargeRatio(blockNumber, planetTacticalStrikeData));
        }
      },
    },
    { runOnInit: false },
  );

  tables.Planet_TacticalStrike.watch({
    world: systemsWorld,
    onChange: ({ entity, properties: { current } }) => {
      if (!current) return;

      const blockNumber = tables.BlockNumber.get()?.value ?? 0n;
      scene.objects.planet.get(entity)?.setOverheatProgress(getChargeRatio(blockNumber, current));
    },
  });
};
