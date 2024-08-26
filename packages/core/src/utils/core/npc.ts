import { ERoutine } from "@primodiumxyz/contracts/config/enums";

import { EDirection, EEmpire } from "@primodiumxyz/contracts";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";
import { getDirection, getNeighbor } from "@core/utils/global/coord";

import { calculateRoutinePcts, calculateRoutineThresholds } from "../global/calculateRoutineThresholds";

export const createNpcUtils = (tables: Tables) => {
  const getRoutineProbabilities = (planetId: Entity) => {
    const vulnerability = getVulnerability(planetId);
    const planetStrength = getPlanetStrength(planetId);
    const empireStrength = getEmpireStrength(planetId);
    const attackTargetId = getAttackTarget(planetId);
    const supportTargetId = getSupportTarget(planetId);
    const shipPrice = tables.P_RoutineCosts.getWithKeys({ routine: ERoutine.BuyShips })?.goldCost ?? 0n;
    const shieldPrice = tables.P_RoutineCosts.getWithKeys({ routine: ERoutine.BuyShields })?.goldCost ?? 0n;
    const shipCount = tables.Planet.get(planetId)?.shipCount ?? 0n;
    const goldCount = tables.Planet.get(planetId)?.goldCount ?? 0n;

    const options = {
      attackMultiplier: !attackTargetId || shipCount === 0n ? 0 : attackTargetId.multiplier,
      supportMultiplier: !supportTargetId || shipCount === 0n ? 0 : supportTargetId.multiplier,
      buyShipMultiplier: goldCount < shipPrice ? 0 : 1,
      buyShieldMultiplier: goldCount < shieldPrice ? 0 : 1,
    };
    const probabilities = calculateRoutinePcts(vulnerability, planetStrength, empireStrength, options);
    return {
      context: { vulnerability, planetStrength, empireStrength },
      probabilities,
      attackTargetId,
      supportTargetId,
    };
  };
  const getRoutineThresholds = (planetId: Entity) => {
    const data = getRoutineProbabilities(planetId);
    const thresholds = calculateRoutineThresholds(data.probabilities);
    return {
      ...thresholds,
      planetId,
      attackTargetId: data.attackTargetId.target ?? planetId,
      supportTargetId: data.supportTargetId.target ?? planetId,
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
      if (!movePlanetId) return false;
      const movePlanetEmpire = tables.Planet.get(movePlanetId as Entity)?.empireId;
      return movePlanetId === planetId && movePlanetEmpire !== planetData.empireId;
    });
    if (pendingMoves.length === 0) return -1;

    if (
      pendingMoves.find((move) => {
        const pendingMovePlanetData = tables.Planet.get(move)?.shipCount ?? 0;
        return (
          planetData.empireId !== pendingMovePlanetData &&
          pendingMovePlanetData > planetData.shipCount + planetData.shieldCount
        );
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

    const neighbors: Entity[] = getAllNeighbors(planetId).map(({ entity }) => entity);
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
      if (b.resources === a.resources) {
        if (a.empire === empireId) return -1;
        if (b.empire === empireId) return 1;
      }
      return b.resources > a.resources ? 1 : -1;
    });

    const ranks = empireResources.map((resource) => {
      return { empire: resource.empire, rank: empireResources.findIndex((r) => r.empire === resource.empire) };
    });
    const myEmpireRank = ranks.find((rank) => rank.empire === empireId)?.rank;

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
  const getAttackTarget = (planetId: Entity): { target: Entity | undefined; multiplier: number } => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData || planetData.empireId === 0) return { target: undefined, multiplier: 0 };

    const allNeighbors = getAllNeighbors(planetId).map(({ entity }) => entity);
    if (allNeighbors.length === 0) return { target: undefined, multiplier: 0 };

    const enemyNeighbors = allNeighbors.filter((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      return neighborData?.empireId !== planetData.empireId;
    });
    if (enemyNeighbors.length === 0) return { target: undefined, multiplier: 0 };

    // check for magnets and select random one
    const magnetizedPlanets = enemyNeighbors.filter((neighbor) =>
      tables.Magnet.hasWithKeys({ planetId: neighbor, empireId: planetData.empireId }),
    );
    if (magnetizedPlanets.length > 0) {
      const randomIndex = Math.floor(Math.random() * magnetizedPlanets.length);
      return { target: magnetizedPlanets[randomIndex], multiplier: 4 };
    }
    // Get direction weights
    const directionWeights = getDirectionWeights(planetId);
    // find weakest attack target, considering direction weights
    let bestTarget: Entity | undefined;
    let lowestWeightedDefense = Infinity;

    enemyNeighbors.forEach((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (!neighborData) return;

      const enemyDefense = neighborData.shipCount + neighborData.shieldCount;
      const direction = getNeighborDirection(planetId, neighbor);
      const weight = directionWeights[direction] || 1;
      const weightedDefense = Number(enemyDefense) / weight;

      if (weightedDefense < lowestWeightedDefense) {
        bestTarget = neighbor;
        lowestWeightedDefense = weightedDefense;
      }
    });

    return { target: bestTarget, multiplier: 1 };
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
  const getSupportTarget = (planetId: Entity): { target: Entity | undefined; multiplier: number } => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData || planetData.empireId === 0) return { target: undefined, multiplier: 0 };

    const allNeighbors = getAllNeighbors(planetId).map(({ entity }) => entity);
    if (allNeighbors.length === 0) return { target: undefined, multiplier: 0 };

    const allyNeighbors = allNeighbors.filter((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      return neighborData?.empireId === planetData.empireId && neighbor !== planetId;
    });
    // check for magnets and select random one
    const magnetizedPlanets = allyNeighbors.filter((neighbor) =>
      tables.Magnet.hasWithKeys({ planetId: neighbor, empireId: planetData.empireId }),
    );
    if (magnetizedPlanets.length > 0) {
      const randomIndex = Math.floor(Math.random() * magnetizedPlanets.length);
      return { target: magnetizedPlanets[randomIndex], multiplier: 3 };
    }
    const multiplier = allyNeighbors.length > 4 ? 2 : 1;
    // Get direction weights
    const directionWeights = getDirectionWeights(planetId);

    // find weakest support target, considering direction weights
    let bestTarget: Entity | undefined;
    let lowestWeightedDefense = Infinity;

    allyNeighbors.forEach((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (!neighborData) return;

      const allyDefense = neighborData.shipCount + neighborData.shieldCount;
      const direction = getNeighborDirection(planetId, neighbor);
      const weight = directionWeights[direction] || 1;
      const weightedDefense = Number(allyDefense) * weight; // Invert weight for support

      if (weightedDefense < lowestWeightedDefense) {
        bestTarget = neighbor;
        lowestWeightedDefense = weightedDefense;
      }
    });

    return { target: bestTarget, multiplier };
  };

  /**
   * Retrieves all neighboring planets for a given planet.
   *
   * @param {Entity} planetId - The ID of the planet to find neighbors for.
   * @returns {Entity[]} An array of Entity IDs representing the neighboring planets.
   *
   * This function performs the following steps:
   * 1. Retrieves the data for the given planet.
   * 2. Gets all planets from the game state.
   * 3. Checks all six directions (East, Southeast, Southwest, West, Northwest, Northeast) for neighbors.
   * 4. For each direction, calculates the coordinates of the potential neighbor.
   * 5. Finds the planet (if any) at those coordinates.
   * 6. Returns an array of all found neighboring planet IDs.
   *
   * Note: This function should be moved to a more general utils file in the future,
   * as it's not specific to NPC behavior and could be useful in other contexts.
   */
  const getAllNeighbors = (planetId: Entity): { entity: Entity; direction: EDirection }[] => {
    const planetData = tables.Planet.get(planetId);
    const allPlanets = tables.Keys_PlanetsSet.get()?.itemKeys.map((planet) => {
      return { planetId: planet, ...tables.Planet.get(planet as Entity)! };
    });
    if (!planetData || !allPlanets) return [];

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
        return { entity: neighbor?.planetId, direction };
      })
      .filter(({ entity }) => entity !== undefined) as { entity: Entity; direction: EDirection }[];
  };

  const getDirectionWeights = (planetId: Entity, radius: number = 2): Record<EDirection, number> => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData) return {} as Record<EDirection, number>;

    const directions = [
      EDirection.East,
      EDirection.Southeast,
      EDirection.Southwest,
      EDirection.West,
      EDirection.Northwest,
      EDirection.Northeast,
    ];

    const allPlanets =
      tables.Keys_PlanetsSet.get()?.itemKeys.map((planet) => {
        return { planetId: planet, ...tables.Planet.get(planet as Entity)! };
      }) ?? [];

    const countEnemyPlanets = (q: number, r: number, steps: number): number => {
      if (steps === 0) return 0;

      const neighbor = allPlanets.find((planet) => Number(planet.q) === q && Number(planet.r) === r);
      if (!neighbor) return 0;
      const isEnemy = neighbor.empireId !== planetData.empireId ? 1 : 0;

      return (
        isEnemy +
        directions.reduce((sum, dir) => {
          const nextCoords = getNeighbor(q, r, dir);
          return sum + countEnemyPlanets(nextCoords.q, nextCoords.r, steps - 1);
        }, 0)
      );
    };

    const enemyCounts = directions.map((dir) => {
      const coords = getNeighbor(Number(planetData.q), Number(planetData.r), dir);
      return countEnemyPlanets(coords.q, coords.r, radius);
    });

    const maxCount = Math.max(...enemyCounts, 1);
    const weights = enemyCounts.map((count) => count / maxCount); // Higher weight for more enemy planets

    return Object.fromEntries(directions.map((dir, index) => [dir, weights[index]])) as Record<EDirection, number>;
  };

  const getNeighborDirection = (from: Entity, to: Entity) => {
    const fromPlanet = tables.Planet.get(from);
    const toPlanet = tables.Planet.get(to);
    if (!fromPlanet || !toPlanet) return EDirection.East;

    return getDirection({ q: fromPlanet.q, r: fromPlanet.r }, { q: toPlanet.q, r: toPlanet.r });
  };

  return {
    getRoutineProbabilities,
    getRoutineThresholds,
    getVulnerability,
    getPlanetStrength,
    getEmpireStrength,
    getAllNeighbors,
    getDirectionWeights,
  };
};
