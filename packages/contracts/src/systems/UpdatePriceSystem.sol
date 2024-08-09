// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EEmpire } from "codegen/common.sol";

contract UpdatePriceSystem is System {
  function updatePrice() public {
    for (uint i = 1; i < uint256(EEmpire.LENGTH); i++) {
      LibPrice.turnEmpirePointCostDown(EEmpire(i));
      LibPrice.empireOverridesCostDown(EEmpire(i));
    }
  }
}
