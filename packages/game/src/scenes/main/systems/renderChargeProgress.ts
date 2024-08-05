import { Core } from "@primodiumxyz/core";
import { namespaceWorld } from "@primodiumxyz/reactive-tables";

import { PrimodiumScene } from "@game/types";

export const renderChargeProgress = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");
  const planets = tables.Planet.getAll();
  const maxCharge = tables.P_TacticalStrikeConfig.get()?.maxCharge ?? 0n;

  tables.BlockNumber.watch({
    world: systemsWorld,
    onChange: ({ properties: { current } }) => {
      const blockNumber = current?.value ?? 0n;
      for (const planet of planets) {
        const planetTacticalStrikeData =
          tables.Planet_TacticalStrike.getWithKeys({ planetId: planet });

        if (!planetTacticalStrikeData) continue;

        const blocksElapsed =
          blockNumber - planetTacticalStrikeData.lastUpdated;
        const chargeProgress =
          planetTacticalStrikeData.charge +
          (blocksElapsed * planetTacticalStrikeData.chargeRate) / 100n;

        scene.objects.planet
          .get(planet)
          ?.setChargeProgress(Number(chargeProgress) / Number(maxCharge));
      }
    },
  });
};
