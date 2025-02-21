// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { P_GameConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract UpdatePriceSubsystem is EmpiresSystem {
  function updatePrice() public {
    for (uint8 i = 1; i <= P_GameConfig.getEmpireCount(); i++) {
      LibPrice.turnEmpirePointPriceDown(EEmpire(i));
      LibPrice.empireOverridesCostDown(EEmpire(i));
    }
  }
}
