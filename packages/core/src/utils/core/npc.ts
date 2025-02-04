import { ERoutine } from "@primodiumxyz/contracts/config/enums";

import { EDirection, EEmpire } from "@primodiumxyz/contracts";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tables } from "@core/lib";
import { directions, getDirection, getNeighbor, hexDistance } from "@core/utils/global/coord";

import { calculateRoutinePcts, calculateRoutineThresholds } from "../global/calculateRoutineThresholds";

export const createNpcUtils = (tables: Tables) => {
  const getRoutineProbabilities = (planetId: Entity) => {
    const vulnerability = getVulnerability(planetId);
    const planetStrength = getPlanetStrength(planetId);
    const empireStrength = getEmpireStrength(planetId);

    const { multipliers, moveTargetId } = getRoutineMultipliers(planetId);
    const probabilities = calculateRoutinePcts(vulnerability, planetStrength, empireStrength, multipliers);
    return {
      context: { vulnerability, planetStrength, empireStrength },
      probabilities,
      moveTargetId,
    };
  };

  const getRoutineMultipliers = (planetId: Entity) => {
    const shipPrice = tables.P_RoutineCosts.getWithKeys({ routine: ERoutine.BuyShips })?.goldCost ?? 0n;
    const shieldPrice = tables.P_RoutineCosts.getWithKeys({ routine: ERoutine.BuyShields })?.goldCost ?? 0n;
    const shipCount = tables.Planet.get(planetId)?.shipCount ?? 0n;
    const goldCount = tables.Planet.get(planetId)?.goldCount ?? 0n;
    const moveTargetId = getMoveTarget(planetId);

    const lotsOfGold = 30n;
    const buyShipMultiplier = goldCount < shipPrice ? 0 : goldCount > lotsOfGold ? 2 : 1;
    const buyShieldMultiplier = goldCount < shieldPrice ? 0 : goldCount > lotsOfGold ? 2 : 1;

    const multipliers = {
      moveShipsMultiplier: !moveTargetId || shipCount === 0n ? 0 : moveTargetId.multiplier,
      buyShipMultiplier,
      buyShieldMultiplier,
      accumulateGoldMultiplier: lotsOfGold ? 0 : 1,
    };

    return {
      multipliers,
      moveTargetId,
    };
  };

  const getRoutineThresholds = (planetId: Entity) => {
    const data = getRoutineProbabilities(planetId);
    const thresholds = calculateRoutineThresholds(data.probabilities);
    return {
      ...thresholds,
      planetId,
      moveTargetId: data.moveTargetId.target ?? planetId,
    };
  };

  /**
   * Calculates the vulnerability of a planet based on pending moves towards it.
   *
   * @param planetId - The ID of the planet to evaluate.
   * @returns A number representing the planet's vulnerability: -1 - No pending moves towards the planet (least
   *   vulnerable). 0 - Pending moves exist, but none are stronger than the planet. 1 - At least one pending move is
   *   stronger than the planet (most vulnerable).
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
    if (pendingMoves.length === 0) return 0;

    if (
      pendingMoves.find((move) => {
        const pendingMovePlanetData = tables.Planet.get(move)?.shipCount ?? 0;
        return (
          planetData.empireId !== pendingMovePlanetData &&
          pendingMovePlanetData > planetData.shipCount + planetData.shieldCount
        );
      })
    ) {
      return 2;
    }
    return 1;
  };

  /**
   * Calculates the strength of a planet relative to its neighbors.
   *
   * @param planetId - The ID of the planet to evaluate.
   * @returns A number representing the planet's strength: -1 - The planet is weaker than at least one enemy neighbor. 0
   *   - The planet is equal in strength to at least one enemy neighbor. 1 - The planet is stronger than all enemy
   *   neighbors or has no neighbors.
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
   * @returns A number representing the empire's strength: -1 - The empire is in last place. 0 - The empire is in second
   *   place. 1 - The empire is tied for first place. 2 - The empire is leading.
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
   * Determines the best move target for a given planet based on neighboring planets and priorities.
   *
   * @param {Entity} planetId - The ID of the planet for which to find the move target.
   * @returns {{ target: Entity | undefined; multiplier: number }} An object containing the best target planet and a
   *   multiplier value.
   */
  const getMoveTarget = (planetId: Entity): { target: Entity | undefined; multiplier: number } => {
    const planetData = tables.Planet.get(planetId);
    if (!planetData || planetData.empireId === 0 || planetData.shipCount === 0n)
      return { target: undefined, multiplier: 0 };

    const allNeighbors = getAllNeighbors(planetId).map(({ entity }) => entity);
    if (allNeighbors.length === 0) return { target: undefined, multiplier: 0 };
    // Get direction weights
    const directionWeights = createHeatmap(planetId);
    // find weakest attack target, considering direction weights
    let bestTarget: Entity | undefined;
    let highestPriority = -1;
    let highestWeight = -Infinity;
    let multiplier = 1;

    allNeighbors.forEach((neighbor) => {
      const neighborData = tables.Planet.get(neighbor);
      if (!neighborData) return;

      const planetPosition = { q: Number(planetData.q), r: Number(planetData.r) };
      const neighborPosition = { q: Number(neighborData.q), r: Number(neighborData.r) };
      const direction = getDirection(planetPosition, neighborPosition);
      const weight = directionWeights.heatmap.get(direction) || 1;

      // Priority 1: Magnet
      if (tables.Magnet.hasWithKeys({ planetId: neighbor, empireId: planetData.empireId })) {
        bestTarget = neighbor;
        multiplier = 6;
        return; // Exit the loop early as magnet has highest priority
      }

      // Priority 2: Neutral planet in the direction of highest weight
      if (
        neighborData.empireId === EEmpire.NULL &&
        (highestPriority < 2 || (highestPriority === 2 && weight > highestWeight))
      ) {
        bestTarget = neighbor;
        highestPriority = 2;
        highestWeight = weight;
        multiplier = 1.5;
      }

      // Priority 3: Weak enemy planet
      else if (
        neighborData.empireId !== planetData.empireId &&
        neighborData.empireId !== EEmpire.NULL &&
        neighborData.shipCount < planetData.shipCount &&
        (highestPriority < 1 || (highestPriority === 1 && weight > highestWeight))
      ) {
        bestTarget = neighbor;
        highestPriority = 1;
        highestWeight = weight;
        multiplier = 1;
      }

      // Priority 4: Highest weight direction (when surrounded by friendly planets)
      else if (
        neighborData.empireId === planetData.empireId &&
        (highestPriority < 0 || (highestPriority === 0 && weight > highestWeight))
      ) {
        if (weight > highestWeight) {
          bestTarget = neighbor;
          highestWeight = weight;
          highestPriority = 0;
          multiplier = 1;
        }
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
   *   This function performs the following steps:
   *
   *   1. Retrieves the data for the given planet.
   *   2. Gets all planets from the game state.
   *   3. Checks all six directions (East, Southeast, Southwest, West, Northwest, Northeast) for neighbors.
   *   4. For each direction, calculates the coordinates of the potential neighbor.
   *   5. Finds the planet (if any) at those coordinates.
   *   6. Returns an array of all found neighboring planet IDs.
   *
   *   Note: This function should be moved to a more general utils file in the future, as it's not specific to NPC
   *   behavior and could be useful in other contexts.
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

  /**
   * Creates a heatmap based on the influence of neighboring planets around the given source planet.
   *
   * @param {Entity} sourcePlanet - The ID of the source planet.
   * @returns {Map<EDirection, number>} A map representing the heatmap with directions and influence values.
   */
  function createHeatmap(sourcePlanet: Entity): {
    heatmap: Map<EDirection, number>;
    influenceMap: Map<Entity, number>;
  } {
    const heatmap = new Map<EDirection, number>();
    const influenceMap = new Map<Entity, number>();
    const sourcePlanetData = tables.Planet.get(sourcePlanet);
    if (!sourcePlanetData) return { heatmap, influenceMap };
    // Initialize heatmap
    directions.forEach((dir) => heatmap.set(dir, 0));

    // Weight factors
    const weights = {
      friendly: 0,
      neutral: 2,
      enemy: 1,
    };

    const planets = tables.Planet.getAll();
    // Calculate influence for each planet
    planets.forEach((planet) => {
      const planetData = tables.Planet.get(planet);
      if (!planetData) return;
      const npcPosition = { q: Number(sourcePlanetData.q), r: Number(sourcePlanetData.r) };
      const targetPosition = { q: Number(planetData.q), r: Number(planetData.r) };
      const distance = hexDistance(npcPosition, targetPosition);
      if (distance === 0) return; // Skip if it's the NPC's position

      const planetType =
        planetData.empireId === sourcePlanetData.empireId
          ? "friendly"
          : planetData.empireId === EEmpire.NULL
            ? "neutral"
            : "enemy";

      const hasMagnet = tables.Magnet.hasWithKeys({ planetId: planet, empireId: sourcePlanetData.empireId });
      const magnetBonus = hasMagnet ? 2 : 1;

      const influence = (weights[planetType] / distance) * magnetBonus;
      const direction = getDirection(npcPosition, targetPosition);

      heatmap.set(direction, (heatmap.get(direction) || 0) + influence);
      influenceMap.set(planet, influence);
    });

    return { heatmap, influenceMap };
  }

  return {
    getRoutineProbabilities,
    getRoutineThresholds,
    getRoutineMultipliers,
    getVulnerability,
    getPlanetStrength,
    getEmpireStrength,
    getAllNeighbors,
    createHeatmap,
  };
};
