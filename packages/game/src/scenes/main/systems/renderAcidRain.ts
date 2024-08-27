import { EEmpire } from "@primodiumxyz/contracts";
import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { allEmpires } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

export const renderAcidRain = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  const updateAcidForEmpire = (empire: EEmpire) => {
    const planets = tables.Planet.getAllWith({ empireId: empire });
    planets.forEach((entity) => {
      const planet = scene.objects.planet.get(entity);
      if (!planet) return;

      const cyclesLeft = tables.Value_AcidPlanetsSet.getWithKeys({ planetId: entity, empireId: empire });
      planet.setAcid(cyclesLeft);
    });
  };

  // 1. Initial state
  const empireCount = tables.P_GameConfig.get()?.empireCount ?? 0;
  allEmpires.slice(0, empireCount).forEach((empire) => updateAcidForEmpire(empire));

  // 2. update acid rain on new turn
  // 3. update acid rain on placement

  // 2. Update acid rain for all planets of an empire after its turn was resolved
  tables.Turn.watch(
    {
      world: systemsWorld,
      onChange: ({ properties: { prev } }) => {
        const prevEmpire = prev?.empire ?? EEmpire.NULL;
        if (!prevEmpire) return;

        updateAcidForEmpire(prevEmpire);
      },
    },
    { runOnInit: false },
  );

  // 3. Add acid rain on placement
  tables.PlaceAcidOverrideLog.watch(
    {
      world: systemsWorld,
      onChange: ({ properties: { current } }) => {
        if (!current) return;
        const planet = scene.objects.planet.get(current.planetId as Entity);
        if (!planet) return;

        const acidDuration = (tables.P_AcidConfig.get()?.acidDuration ?? 1n) - 1n;
        planet.setAcid(acidDuration);
      },
    },
    { runOnInit: false },
  );
};
