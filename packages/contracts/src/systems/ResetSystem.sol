// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { Turn, P_GameConfig, P_GameConfigData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract ResetSystem is System {
  function resetGame(uint256 _gameStartBlock) public {
    require(_gameStartBlock > block.number, "[ResetSystem] Game must start in the future");
    IWorld world = IWorld(_world());
    world.Empires__clearLoop();
    P_GameConfigData memory config = P_GameConfig.get();

    P_GameConfig.setGameStartBlock(_gameStartBlock);
    P_GameConfig.setGameOverBlock(_gameStartBlock + config.nextGameLengthTurns * config.turnLengthBlocks);
    createPlanets(); // Planet and Empire tables are reset to default values
    LibShieldEater.initialize(); // ShieldEater relocated, charge reset, and destination set
    initPrice(); // Empire.setPointPrice and OverrideCost tables are reset to default values
    Turn.set(_gameStartBlock + config.turnLengthBlocks, EEmpire.Red, 1);
  }
}
