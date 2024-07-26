import { EEmpire } from "@primodiumxyz/contracts";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";

export const createEmpireUtils = (tables: Tables) => {
  const getEmpirePlanets = (empireId: EEmpire): Entity[] => {
    return (tables.Keys_PlanetsSet.getWithKeys({ empireId })?.itemKeys as Entity[]) ?? [];
  };

  return {
    getEmpirePlanets,
  };
};
