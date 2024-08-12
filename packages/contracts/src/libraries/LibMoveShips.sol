// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Turn, PendingMove, PendingMoveData, Empire, Planet, PlanetData, MoveRoutineLog, MoveRoutineLogData, Arrivals } from "codegen/index.sol";
import { EMovement, EDirection, EOrigin } from "codegen/common.sol";
import { pseudorandom, pseudorandomEntity, coordToId } from "src/utils.sol";

library LibMoveShips {
  /**
   * @dev Creates a pending move for ships from a given planet.
   * @param planetId The ID of the planet from which ships will move.
   * @param targetId The ID of the planet to which ships will move.
   * @return bool Returns true if a pending move was successfully created, false otherwise.
   */
  function createPendingMove(bytes32 planetId, bytes32 targetId) internal returns (bool) {
    PlanetData memory planetData = Planet.get(planetId);
    if (!Planet.getIsPlanet(targetId)) revert("[LibMoveShips] Target is not a planet");
    // Return false if the planet has no empire or no ships
    if (planetData.empireId == 0 || planetData.shipCount == 0) return false;

    // Create a pending move with the current empire and the target planet
    PendingMove.set(planetId, PendingMoveData({ empireId: planetData.empireId, destinationPlanetId: targetId }));

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
   * 6. Logs the move for off-chain tracking.
   */
  function executePendingMoves(bytes32 planetId) internal {
    PlanetData memory planetData = Planet.get(planetId);
    bytes32 destinationPlanetId = PendingMove.getDestinationPlanetId(planetId);
    // Clear the pending move
    PendingMove.deleteRecord(planetId);

    if (destinationPlanetId == bytes32(0)) return;

    // todo: make it variable
    uint256 shipsToMove = planetData.shipCount;

    // Execute the move
    Planet.setShipCount(planetId, planetData.shipCount - shipsToMove);
    Arrivals.set(destinationPlanetId, planetData.empireId, shipsToMove);

    // Log the move
    MoveRoutineLog.set(
      pseudorandomEntity(),
      MoveRoutineLogData({
        turn: Turn.getValue(),
        originPlanetId: planetId,
        destinationPlanetId: destinationPlanetId,
        shipCount: shipsToMove,
        timestamp: block.timestamp
      })
    );
  }
}
