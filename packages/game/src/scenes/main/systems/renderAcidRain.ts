import { EEmpire } from "@primodiumxyz/contracts";
import { Core } from "@primodiumxyz/core";
import { Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";
import { allEmpires } from "@game/lib/constants/common";
import { PrimodiumScene } from "@game/types";

// At how many turns left it starts expiring
const EXPIRE_TURNS = 2n;

export const renderAcidRain = (scene: PrimodiumScene, core: Core) => {
  const {
    tables,
    network: { world },
    utils: { getNextTurn: getNextEmpireTurn, getEmpireInTurns },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  const updateAcidForEmpire = (empire: EEmpire) => {
    const planets = tables.Planet.getAllWith({ empireId: empire });
    planets.forEach((entity) => {
      const planet = scene.objects.planet.get(entity);
      if (!planet) return;

      const cyclesLeft = tables.Value_AcidPlanetsSet.getWithKeys({ planetId: entity, empireId: empire })?.value ?? 0n;

      // expiring means that there are only 2 empire turns ("sub" turns) left
      const subTurnsLeft = getNextEmpireTurn(empire);
      planet.setAcid(Number(cyclesLeft), cyclesLeft === 1n && subTurnsLeft <= EXPIRE_TURNS);
    });
  };

  // 1. Initial state
  const empireCount = tables.P_GameConfig.get()?.empireCount ?? 0;
  allEmpires.slice(0, empireCount).forEach((empire) => updateAcidForEmpire(empire));

  // 2. Update acid rain for all planets of an empire after its turn was resolved
  // Also update acid rain for empire in EXPIRE_TURNS turns (in case some should expire)
  tables.Turn.watch(
    {
      world: systemsWorld,
      onChange: ({ properties: { prev } }) => {
        const prevEmpire = prev?.empire ?? EEmpire.NULL;
        if (!prevEmpire) return;

        updateAcidForEmpire(prevEmpire);
        updateAcidForEmpire(getEmpireInTurns(EXPIRE_TURNS));
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
        planet.setAcid(Number(acidDuration), false);
      },
    },
    { runOnInit: false },
  );
};
