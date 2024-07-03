// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { P_GameConfig } from "codegen/index.sol";

contract EmpiresSystem is System {
  modifier _onlyNotGameOver() {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock == 0 || block.number < endBlock, "[EmpiresSystem] Game over");
    _;
  }
}
