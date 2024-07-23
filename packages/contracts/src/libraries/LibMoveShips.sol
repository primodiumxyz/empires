// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { PendingMove, PendingMoveData, Empire, Planet, PlanetData, P_NPCMoveThresholds, P_NPCMoveThresholdsData, MoveNPCAction, MoveNPCActionData, Arrivals } from "codegen/index.sol";
import { EEmpire, EMovement, EDirection, EOrigin } from "codegen/common.sol";
import { pseudorandom, pseudorandomEntity, coordToId } from "src/utils.sol";

library LibMoveShips {
  /**
   * @dev Creates a pending move for ships from a given planet.
   * @param planetId The ID of the planet from which ships will move.
   * @return bool Returns true if a pending move was successfully created, false otherwise.
   */
  function createPendingMove(bytes32 planetId) internal returns (bool) {
    PlanetData memory planetData = Planet.get(planetId);
    // Return false if the planet has no empire or no ships
    if (planetData.empireId == EEmpire.NULL || planetData.shipCount == 0) return false;

    // Find a valid target planet for the move
    bytes32 target;
    uint i = 0;
    do {
      // Generate a random value based on the planet ID and iteration
      uint256 randomValue = pseudorandom(uint256(planetId) + (i * 256), 10_000);
      // Get a potential target planet
      target = getPlanetTarget(planetData, randomValue);
      i++;
    } while (!Planet.getIsPlanet(target)); // Repeat until a valid planet is found

    // Return false if the target is the same as the origin
    if (target == planetId) return false;

    // Create a pending move with the current empire and the target planet
    PendingMove.set(planetId, PendingMoveData({ empireId: planetData.empireId, destinationPlanetId: target }));

    return true;
  }

  /**
   * @dev Executes pending moves for ships from a given planet.
   * @param planetId The ID of the planet from which ships will move.
   *
   * This function performs the following steps:
   * 1. Retrieves the current planet data and the destination planet ID.
   * 2. If there's no valid destination, the function returns early.
   * 3. Calculates the number of ships to move and the total ships arriving at the destination.
   * 4. Updates the ship count on the origin planet and the arrivals on the destination planet.
   * 5. Clears the pending move record.
   * 6. Logs the move action for off-chain tracking.
   */
  function executePendingMoves(bytes32 planetId) internal {
    PlanetData memory planetData = Planet.get(planetId);
    bytes32 destinationPlanetId = PendingMove.getDestinationPlanetId(planetId);

    if (destinationPlanetId == bytes32(0)) return;

    uint256 shipsToMove = planetData.shipCount;
    uint256 arrivingShips = Arrivals.get(destinationPlanetId, planetData.empireId);

    uint256 shipCount = arrivingShips + shipsToMove;

    // Execute the move
    Planet.setShipCount(planetId, planetData.shipCount - shipsToMove);
    Arrivals.set(destinationPlanetId, planetData.empireId, shipCount);

    // Clear the pending move
    PendingMove.deleteRecord(planetId);

    // Log the move
    MoveNPCAction.set(
      pseudorandomEntity(),
      MoveNPCActionData({
        originPlanetId: planetId,
        destinationPlanetId: destinationPlanetId,
        shipCount: shipsToMove,
        timestamp: block.timestamp
      })
    );
  }

  function getPlanetTarget(PlanetData memory planetData, uint256 randomValue) internal view returns (bytes32 target) {
    EMovement movement = getMovement(randomValue);
    EDirection direction = getDirection(movement, randomValue % 2 == 0, Empire.getOrigin(planetData.empireId));

    (int128 q, int128 r) = getNeighbor(planetData.q, planetData.r, direction);
    target = coordToId(q, r);
  }
  // origins: North, Southwest, Southeast
  // North: Expand: Southeast, Southwest, Retreat: Northwest, Northeast, Lateral: East, West
  // Southeast Expand: Northwest, West, Retreat: Southeast, East, Lateral: Northeast, Southwest
  // Southwest Expand: Northeast, East, Retreat: Southwest, West, Lateral: Northwest, Southeast

  function getDirection(EMovement movement, bool left, EOrigin origin) internal pure returns (EDirection) {
    if (movement == EMovement.NULL) {
      return EDirection.NULL;
    }

    if (origin == EOrigin.North) {
      if (movement == EMovement.Expand) {
        return left ? EDirection.Southeast : EDirection.Southwest;
      } else if (movement == EMovement.Lateral) {
        return left ? EDirection.East : EDirection.West;
      } else {
        return left ? EDirection.Northeast : EDirection.Northwest;
      }
    } else if (origin == EOrigin.Southeast) {
      if (movement == EMovement.Expand) {
        return left ? EDirection.Northwest : EDirection.West;
      } else if (movement == EMovement.Lateral) {
        return left ? EDirection.Northeast : EDirection.Southwest;
      } else {
        return left ? EDirection.Southeast : EDirection.East;
      }
    } else if (origin == EOrigin.Southwest) {
      if (movement == EMovement.Expand) {
        return left ? EDirection.Northeast : EDirection.East;
      } else if (movement == EMovement.Lateral) {
        return left ? EDirection.Southeast : EDirection.Northwest;
      } else {
        return left ? EDirection.Southwest : EDirection.West;
      }
    } else {
      return EDirection.NULL;
    }
  }

  function getMovement(uint256 value) private view returns (EMovement) {
    P_NPCMoveThresholdsData memory moveConfig = P_NPCMoveThresholds.get();
    if (value < moveConfig.none) {
      return EMovement.NULL;
    } else if (value < moveConfig.expand) {
      return EMovement.Expand;
    } else if (value < moveConfig.lateral) {
      return EMovement.Lateral;
    } else if (value < moveConfig.retreat) {
      return EMovement.Retreat;
    } else {
      return EMovement.NULL;
    }
  }

  function getNeighbor(int128 q, int128 r, EDirection direction) internal pure returns (int128, int128) {
    if (direction == EDirection.East) {
      return (q + 1, r);
    } else if (direction == EDirection.Southeast) {
      return (q, r + 1);
    } else if (direction == EDirection.Southwest) {
      return (q - 1, r + 1);
    } else if (direction == EDirection.West) {
      return (q - 1, r);
    } else if (direction == EDirection.Northwest) {
      return (q, r - 1);
    } else if (direction == EDirection.Northeast) {
      return (q + 1, r - 1);
    } else {
      return (q, r);
    }
  }
}
