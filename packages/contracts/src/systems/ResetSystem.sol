// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/tables/NamespaceOwner.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { Role, Turn, P_GameConfig, P_GameConfigData } from "codegen/index.sol";
import { EEmpire, ERole } from "codegen/common.sol";

contract ResetSystem is System {
  // Modifier to restrict access to admin only
  modifier _onlyAdmin() {
    address sender = _msgSender();
    require(
      Role.get(sender) == ERole.Admin || NamespaceOwner.get(EMPIRES_NAMESPACE_ID) == sender,
      "[EmpiresSystem] Only admin"
    );
    _;
  }

  function resetGame() public {
    IWorld world = IWorld(_world());
    world.Empires__clearLoop();
    P_GameConfigData memory config = P_GameConfig.get();

    P_GameConfig.setGameOverBlock(block.number + config.nextGameLengthTurns * config.turnLengthBlocks);
    P_GameConfig.setGameStartTimestamp(block.timestamp);
    createPlanets(); // Planet and Empire tables are reset to default values
    LibShieldEater.initialize(); // ShieldEater relocated, charge reset, and destination set
    initPrice(); // Empire.setPointCost and OverrideCost tables are reset to default values
    Turn.set(block.number + config.turnLengthBlocks, EEmpire.Red, 1);
  }
}
