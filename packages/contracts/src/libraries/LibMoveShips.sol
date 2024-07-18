// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Planet, PlanetData, P_NPCMoveThresholds, P_NPCMoveThresholdsData, MoveNPCAction, MoveNPCActionData, Arrivals } from "codegen/index.sol";
import { EEmpire, EMovement, EDirection, EOrigin } from "codegen/common.sol";
import { pseudorandom, pseudorandomEntity, coordToId } from "src/utils.sol";

library LibMoveShips {
  function moveShips(bytes32 planetId) internal returns (bool) {
    PlanetData memory planetData = Planet.get(planetId);
    if (planetData.factionId == EEmpire.NULL || planetData.shipCount == 0) return false;

    // move ships
    bytes32 target;
    uint i = 0;
    do {
      uint256 randomValue = pseudorandom(uint256(planetId) + (i * 256), 10_000);
      target = getPlanetTarget(planetData, randomValue);
      i++;
    } while (!Planet.getIsPlanet(target));
    if (target == planetId) return false;

    uint256 shipsToMove = planetData.shipCount;

    Arrivals.set(target, Arrivals.get(target) + shipsToMove);
    Planet.setShipCount(planetId, planetData.shipCount - shipsToMove);
    MoveNPCAction.set(
      pseudorandomEntity(),
      MoveNPCActionData({
        originPlanetId: planetId,
        destinationPlanetId: target,
        shipCount: shipsToMove,
        timestamp: block.timestamp
      })
    );
    return true;
  }

  function getPlanetTarget(PlanetData memory planetData, uint256 randomValue) internal view returns (bytes32 target) {
    EMovement movement = getMovement(randomValue);
    EDirection direction = getDirection(movement, randomValue % 2 == 0, Faction.getOrigin(planetData.factionId));

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
