// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Faction, Planet, PlanetData, P_MoveConfig, P_MoveConfigData, Arrivals } from "codegen/index.sol";
import { EEmpire, EMovement, EDirection, EOrigin } from "codegen/common.sol";
import { pseudorandom, coordToId } from "src/utils.sol";

library LibUpdateWorld {
  function moveDestroyers(bytes32 planetId) internal returns (bool) {
    PlanetData memory planetData = Planet.get(planetId);
    if (planetData.factionId == EEmpire.NULL || planetData.destroyerCount == 0) return false;

    // move destroyers
    bytes32 target;
    uint i = 0;
    do {
      uint256 randomValue = pseudorandom(uint256(planetId) + i, 10_000);
      target = getPlanetTarget(planetData, randomValue);
      i++;
    } while (!Planet.getIsPlanet(target));
    if (target == planetId) return false;

    uint256 destroyersToMove = planetData.destroyerCount;

    Arrivals.set(target, Arrivals.get(target) + destroyersToMove);
    Planet.setDestroyerCount(planetId, planetData.destroyerCount - destroyersToMove);
    return true;
  }

  function getPlanetTarget(PlanetData memory planetData, uint256 randomValue) internal returns (bytes32 target) {
    EMovement movement = getMovement(randomValue);
    EDirection direction = getDirection(movement, randomValue % 2 == 0, Faction.get(planetData.factionId));

    (int128 q, int128 r) = getNeighbor(planetData.q, planetData.r, direction);
    target = coordToId(q, r);
  }
  // origins: North, Southwest, Southeast
  // North: Away: Southeast, Southwest, Toward: Northwest, Northeast, Lateral: East, West
  // Southeast Away: Northwest, West, Toward: Southeast, East, Lateral: Northeast, Southwest
  // Southwest Away: Northeast, East, Toward: Southwest, West, Lateral: Northwest, Southeast

  function getDirection(EMovement movement, bool left, EOrigin origin) internal returns (EDirection) {
    if (movement == EMovement.None) {
      return EDirection.None;
    }

    if (origin == EOrigin.North) {
      if (movement == EMovement.Away) {
        return left ? EDirection.Southeast : EDirection.Southwest;
      } else if (movement == EMovement.Lateral) {
        return left ? EDirection.East : EDirection.West;
      } else {
        return left ? EDirection.Northeast : EDirection.Northwest;
      }
    } else if (origin == EOrigin.Southeast) {
      if (movement == EMovement.Away) {
        return left ? EDirection.Northwest : EDirection.West;
      } else if (movement == EMovement.Lateral) {
        return left ? EDirection.Northeast : EDirection.Southwest;
      } else {
        return left ? EDirection.Southeast : EDirection.East;
      }
    } else if (origin == EOrigin.Southwest) {
      if (movement == EMovement.Away) {
        return left ? EDirection.Northeast : EDirection.East;
      } else if (movement == EMovement.Lateral) {
        return left ? EDirection.Southeast : EDirection.Northwest;
      } else {
        return left ? EDirection.Southwest : EDirection.West;
      }
    } else {
      return EDirection.None;
    }
  }

  function getMovement(uint256 value) private view returns (EMovement) {
    P_MoveConfigData memory moveConfig = P_MoveConfig.get();
    if (value < moveConfig.none) {
      return EMovement.None;
    } else if (value < moveConfig.away) {
      return EMovement.Away;
    } else if (value < moveConfig.lateral) {
      return EMovement.Lateral;
    } else if (value < moveConfig.toward) {
      return EMovement.Toward;
    } else {
      return EMovement.None;
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
