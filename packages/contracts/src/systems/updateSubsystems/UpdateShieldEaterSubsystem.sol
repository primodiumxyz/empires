// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";

contract UpdateShieldEaterSubsystem is EmpiresSystem {
  function updateShieldEater(bytes32 shieldEaterNextPlanetId) public {
    LibShieldEater.update(shieldEaterNextPlanetId);
  }
}
