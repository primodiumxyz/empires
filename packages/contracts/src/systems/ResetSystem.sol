// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { Turn, P_GameConfig } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract ResetSystem is System {
  function resetGame() public {
    IWorld world = IWorld(_world());
    world.Empires__clearLoop();

    P_GameConfig.setGameOverBlock(block.number + 1_000);
    P_GameConfig.setGameStartTimestamp(block.timestamp);
    createPlanets(); // Planet and Empire tables are reset to default values
    LibShieldEater.initialize(); // ShieldEater relocated, charge reset, and destination set
    initPrice(); // Empire.setPointCost and OverrideCost tables are reset to default values
    Turn.set(block.number + P_GameConfig.getTurnLengthBlocks(), EEmpire.Red, 1);
  }
}
