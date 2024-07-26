import { EDirection, EEmpire } from "@primodiumxyz/contracts";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";
import { getNeighbor } from "@core/utils/global/coord";

import { calculateRoutineThresholds } from "../global/calculateRoutineThresholds";

export const createNpcUtils = (tables: Tables) => {
  const getRoutineThresholds = (planetId: Entity) => {
    const vulnerability = getVulnerability(planetId);
    const planetStrength = getPlanetStrength(planetId);
    const empireStrength = getEmpireStrength(planetId);
    const attackTargetId = getAttackTarget(planetId);
    const supportTargetId = getSupportTarget(planetId);

    const thresholds = calculateRoutineThresholds(vulnerability, planetStrength, empireStrength, {
      noAttackTarget: !attackTargetId,
      noSupportTarget: !supportTargetId,
    });
    return {
      ...thresholds,
      planetId,
      attackTargetId: attackTargetId ?? defaultEntity,
      supportTargetId: supportTargetId ?? defaultEntity,
    };
  };

  /**
   * Calculates the vulnerability of a planet based on pending moves towards it.
   *
   * @param planetId - The ID of the planet to evaluate.
   * @returns A number representing the planet's vulnerability:
   *          -1 - No pending moves towards the planet (least vulnerable).
   *           0 - Pending moves exist, but none are stronger than the planet.
   *           1 - At least one pending move is stronger than the planet (most vulnerable).
   */
  const getVulnerability = (planetId: Entity): number => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData) return 0;
    const allPendingMoves = tables.PendingMove.getAll();
    const pendingMoves = allPendingMoves.filter((move) => {
      const movePlanetId = tables.PendingMove.get(move)?.destinationPlanetId;
      return movePlanetId === planetId;
    });
    if (pendingMoves.length === 0) return -1;

    if (
      pendingMoves.find((move) => {
        const pendingMovePlanetData = tables.Planet.get(move)?.shipCount ?? 0;
        return pendingMovePlanetData > planetData?.shipCount;
      })
    ) {
      return 1;
    }
    return 0;
  };

  /**
   * Calculates the strength of a planet relative to its neighbors.
   * @param planetId - The ID of the planet to evaluate.
   * @returns A number representing the planet's strength:
   *          -1 - The planet is weaker than at least one enemy neighbor.
   *           0 - The planet is equal in strength to at least one enemy neighbor.
   *           1 - The planet is stronger than all enemy neighbors or has no neighbors.
   */
  const getPlanetStrength = (planetId: Entity): number => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData) return 0;

    const neighbors: Entity[] = getAllNeighbors(planetId);
    if (neighbors.length === 0) return 1;

    const enemyStrengths = neighbors.reduce(
      (acc, neighbor) => {
        const neighborData = tables.Planet.get(neighbor);
        // Only consider enemy planets (different non-zero empireId)
        if (!neighborData || neighborData.empireId == 0 || neighborData.empireId === planetData.empireId) return acc;
        return [...acc, { neighbor, shipCount: neighborData.shipCount }];
      },
      [] as { neighbor: Entity; shipCount: bigint }[],
    );

    // If there are no enemy neighbors, the planet is considered strong
    if (enemyStrengths.length === 0) return 1;

    // Check if there's any enemy stronger than the current planet
    const strongerEnemy = enemyStrengths.find((enemy) => {
      return enemy.shipCount >= planetData.shipCount;
    });

    // Return -1 if there's a stronger enemy, 0 otherwise
    return strongerEnemy ? -1 : 0;
  };

  /**
   * Calculates the relative strength of an empire based on the given planet's empire.
   *
   * @param planetId - The ID of the planet to evaluate.
   * @returns A number representing the empire's strength:
   *          -1 - The empire is in last place.
   *           0 - The empire is in second place.
   *           1 - The empire is tied for first place.
   *           2 - The empire is leading.
   */
  const getEmpireStrength = (planetId: Entity): number => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData || planetData.empireId === 0) return 0;

    const empireId = planetData.empireId;
    const empires = [EEmpire.Blue, EEmpire.Green, EEmpire.Red] as const;

    const empireResources = empires.map((empire) => {
      const planets = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId: empire })?.itemKeys ?? [];
      const empireTotals = planets.reduce(
        (acc, planet) => {
          const planetData = tables.Planet.get(planet as Entity);
          return {
            gold: acc.gold + (planetData?.goldCount ?? 0n),
            ships: acc.ships + (planetData?.shipCount ?? 0n),
            shields: acc.shields + (planetData?.shieldCount ?? 0n),
          };
        },
        { gold: 0n, ships: 0n, shields: 0n },
      );
      return {
        empire,
        planets: planets.length,
        resources: empireTotals.gold + empireTotals.ships + empireTotals.shields,
      };
    });

    empireResources.sort((a, b) => {
      if (a.planets !== b.planets) {
        return b.planets - a.planets;
      }
      return b.resources > a.resources ? 1 : -1;
    });

    const myEmpireRank = empireResources.findIndex((resource) => resource.empire === empireId);

    if (myEmpireRank === 0 && (empireResources[0]?.resources ?? 0) > (empireResources[1]?.resources ?? 0)) {
      return 2; // My empire is leading
    } else if (
      myEmpireRank === 0 ||
      (myEmpireRank === 1 && (empireResources[0]?.resources ?? 0) === (empireResources[1]?.resources ?? 0))
    ) {
      return 1; // My empire is tied for first
    } else if (myEmpireRank === 1) {
      return 0; // My empire is in second
    } else {
      return -1; // My empire is in last
    }
  };

  /**
   * Determines the best planet to attack from the neighbors of a given planet.
   *
   * @param {Entity} planetId - The ID of the planet from which to launch the attack.
   * @returns {Entity | undefined} The ID of the weakest enemy neighbor planet, or undefined if no valid target is found.
   *
   * This function performs the following steps:
   * 1. Retrieves the data for the given planet.
   * 2. Gets all neighboring planets.
   * 3. Filters out neighbors that belong to the same empire as the given planet.
   * 4. Among the enemy neighbors, finds the one with the weakest defense (lowest sum of ships and shields).
   * 5. Returns the ID of the weakest enemy planet, or undefined if no valid target is found.
   */
  const getAttackTarget = (planetId: Entity): Entity | undefined => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData || planetData.empireId === 0) return;

    const allNeighbors = getAllNeighbors(planetId);
    if (allNeighbors.length === 0) return;

    const enemyNeighbors = allNeighbors.filter((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (neighborData?.empireId !== tables.Planet.get(planetId)?.empireId) {
        return neighbor;
      }
      return undefined;
    });
    // find weakest attack target
    const currWeakest = { planetId: enemyNeighbors[0], defense: 0n };
    enemyNeighbors.forEach((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (!neighborData) return;
      const enemyDefense = neighborData.shipCount + neighborData.shieldCount;
      if (enemyDefense < currWeakest.defense) {
        currWeakest.planetId = neighbor;
        currWeakest.defense = enemyDefense;
      }
    });
    return currWeakest.planetId;
  };

  /**
   * Determines the best planet to support from the neighbors of a given planet.
   *
   * @param {Entity} planetId - The ID of the planet from which to launch the support.
   * @returns {Entity | undefined} The ID of the weakest ally neighbor planet, or undefined if no valid target is found.
   *
   * This function performs the following steps:
   * 1. Retrieves the data for the given planet.
   * 2. Gets all neighboring planets.
   * 3. Filters out neighbors that do not belong to the same empire as the given planet.
   * 4. Among the ally neighbors, finds the one with the weakest defense (lowest sum of ships and shields).
   * 5. Returns the ID of the weakest ally planet, or undefined if no valid target is found.
   */
  const getSupportTarget = (planetId: Entity): Entity | undefined => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData || planetData.empireId === 0) return;

    const allNeighbors = getAllNeighbors(planetId);
    if (allNeighbors.length === 0) return;

    const allyNeighbors = allNeighbors.filter((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (neighborData?.empireId === tables.Planet.get(planetId)?.empireId) {
        return neighbor;
      }
      return undefined;
    });

    // find weakest support target
    const currWeakest = { planetId: allyNeighbors[0], defense: 0n };
    allyNeighbors.forEach((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (!neighborData) return;
      const allyDefense = neighborData.shipCount + neighborData.shieldCount;
      if (allyDefense < currWeakest.defense) {
        currWeakest.planetId = neighbor;
        currWeakest.defense = allyDefense;
      }
    });
    return currWeakest.planetId;
  };

  const getAllNeighbors = (planetId: Entity): Entity[] => {
    const planetData = tables.Planet.get(planetId);
    const allPlanets = tables.Keys_PlanetsSet.getAll().map((planet) => {
      return { planetId: planet, ...tables.Planet.get(planet)! };
    });
    if (!planetData) return [];
    return [
      EDirection.East,
      EDirection.Southeast,
      EDirection.Southwest,
      EDirection.West,
      EDirection.Northwest,
      EDirection.Northeast,
    ]
      .map((direction) => {
        const coords = getNeighbor(Number(planetData.q), Number(planetData.r), direction);
        const neighbor = allPlanets.find((planet) => {
          return Number(planet.q) === coords.q && Number(planet.r) === coords.r;
        });
        return neighbor?.planetId;
      })
      .filter((planetId): planetId is Entity => planetId !== undefined);
  };

  return {
    getRoutineThresholds,
    getVulnerability,
    getPlanetStrength,
    getEmpireStrength,
  };
};
