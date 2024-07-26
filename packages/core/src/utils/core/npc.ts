import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";

import { calculateRoutineThresholds } from "../global/calculateRoutineThresholds";

export const createNpcUtils = (tables: Tables) => {
  const getLikelihoods = (planetId: Entity) => {
    const vulnerability = getVulnerability(planetId);
    const planetStrength = getPlanetStrength(planetId);
    const empireStrength = getEmpireStrength(planetId);
    const thresholds = calculateRoutineThresholds(vulnerability, planetStrength, empireStrength);
    const attackTargetId = getAttackTarget(planetId);
    const supportTargetId = getSupportTarget(planetId);
    return {
      ...thresholds,
      planetId,
      attackTargetId,
      supportTargetId,
    };
  };

  const getVulnerability = (planetId: Entity) => {
    return 0;
  };

  const getPlanetStrength = (planetId: Entity) => {
    return 0;
  };

  const getEmpireStrength = (planetId: Entity) => {
    return 0;
  };

  const getAttackTarget = (planetId: Entity): Entity => {
    return defaultEntity;
  };

  const getSupportTarget = (planetId: Entity): Entity => {
    return defaultEntity;
  };

  return {
    getLikelihoods,
    getVulnerability,
    getPlanetStrength,
    getEmpireStrength,
  };
};
