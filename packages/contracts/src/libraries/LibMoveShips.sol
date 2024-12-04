// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Turn, PendingMove, PendingMoveData, Empire, Planet, PlanetData, MoveRoutineLog, MoveRoutineLogData } from "codegen/index.sol";
import { EEmpire, EMovement, EDirection } from "codegen/common.sol";
import { pseudorandom, nextLogEntity, coordToId } from "src/utils.sol";
import { LibResolveCombat } from "libraries/LibResolveCombat.sol";
import { ArrivedMap } from "adts/ArrivedMap.sol";

library LibMoveShips {
  /**
   * @dev Creates a pending move for ships from a given planet.
   * @notice Does not create pending move if the planet has no empire or no ships.
   * @param planetId The ID of the planet from which ships will move.
   * @param targetId The ID of the planet to which ships will move.
   * @return bool Returns true if a pending move was successfully created, false otherwise.
   */
  function createPendingMove(bytes32 planetId, bytes32 targetId) internal returns (bool) {
    require(Planet.getIsPlanet(targetId), "[LibMoveShips] Target is not a planet");

    PlanetData memory planetData = Planet.get(planetId);
    // Return false if the planet has no empire or no ships
    if (planetData.empireId == EEmpire.NULL || planetData.shipCount == 0) return false;

    // Create a pending move with the current empire and the target planet
    PendingMove.set(planetId, PendingMoveData({ empireId: planetData.empireId, destinationPlanetId: targetId }));

    return true;
  }

  /**
   * @notice Executes pending moves for ships from a given planet.
   * @dev This function performs the following steps:
   * 1. Retrieves the current planet data and the destination planet ID.
   * 2. If there's no valid destination, the function returns early and clears the pending move record.
   * 3. Calculates the number of ships to move, considering ships that have already arrived from allies.
   * 4. Updates the ship count on the origin planet.
   * 5. Executes combat on the destination planet.
   * 6. Clears the pending move record and the arrived map entry for the origin planet.
   * 7. Logs the move for off-chain tracking.
   * @param planetId The ID of the planet from which ships will move.
   */
  function executePendingMoves(bytes32 planetId) internal {
    bytes32 destinationPlanetId = PendingMove.getDestinationPlanetId(planetId);

    if (destinationPlanetId == bytes32(0)) {
      PendingMove.deleteRecord(planetId);
      return;
    }

    PlanetData memory planetData = Planet.get(planetId);
    uint256 allyShipsArrived = ArrivedMap.get(planetId);

    if (planetData.shipCount <= allyShipsArrived) {
      PendingMove.deleteRecord(planetId);
      ArrivedMap.remove(planetId); // under assumption that executePendingMoves is only called once per turn per planet for one empire and ArrivedMap is cleared at the end of each turn, this clear may be redundant
      return;
    }

    uint256 shipsToMove = planetData.shipCount - allyShipsArrived; // prevents ships arriving from other allies from being moved again in the same turn

    // Execute the move
    Planet.setShipCount(planetId, planetData.shipCount - shipsToMove);
    bool conquered = LibResolveCombat.resolveCombat(planetData.empireId, shipsToMove, destinationPlanetId);

    PendingMove.deleteRecord(planetId);
    ArrivedMap.remove(planetId); // under assumption that executePendingMoves is only called once per turn per planet for one empire and ArrivedMap is cleared at the end of each turn, this clear may be redundant

    // Log the move
    MoveRoutineLog.set(
      nextLogEntity(),
      MoveRoutineLogData({
        turn: Turn.getValue(),
        originPlanetId: planetId,
        destinationPlanetId: destinationPlanetId,
        shipCount: shipsToMove,
        timestamp: block.timestamp,
        conquered: conquered
      })
    );
  }
}
