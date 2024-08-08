import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";

export const createCitadelUtils = (tables: Tables) => {
  const getCitadelPlanets = (): Entity[] => {
    return (tables.Keys_CitadelPlanetsSet.get()?.itemKeys as Entity[]) ?? [];
  };

  return {
    getCitadelPlanets,
  };
};
