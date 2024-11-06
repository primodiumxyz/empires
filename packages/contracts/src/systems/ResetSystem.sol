// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { Ready, Turn, P_GameConfig, P_GameConfigData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { EmpiresSystem } from "systems/EmpiresSystem.sol";

contract ResetSystem is EmpiresSystem {
  function resetGame() public _onlyAdminOrCanUpdate returns (bool) {
    if (Ready.get() == true) {
      Ready.set(false);
      P_GameConfig.setEmpiresCleared(0);
    }

    IWorld world = IWorld(_world());

    if (world.Empires__clearLoop() == true) {
      P_GameConfigData memory config = P_GameConfig.get();

      P_GameConfig.setGameOverBlock(block.number + config.nextGameLengthTurns * config.turnLengthBlocks);
      P_GameConfig.setGameStartTimestamp(block.timestamp);
      createPlanets(); // Planet and Empire tables are reset to default values
      LibShieldEater.initialize(); // ShieldEater relocated, charge reset, and destination set
      initPrice(); // Empire.setPointPrice and OverrideCost tables are reset to default values
      Turn.set(block.number + config.turnLengthBlocks, EEmpire.Red, 1);
    }

    return Ready.get();
  }
}
