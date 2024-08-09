// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EEmpire } from "codegen/common.sol";

contract UpdatePriceSubsystem is EmpiresSystem {
  function updatePrice() public {
    for (uint i = 1; i < uint256(EEmpire.LENGTH); i++) {
      LibPrice.turnEmpirePointCostDown(EEmpire(i));
      LibPrice.empireOverridesCostDown(EEmpire(i));
    }
  }
}
