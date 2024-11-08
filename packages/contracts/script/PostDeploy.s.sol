// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPrototypes } from "codegen/Prototypes.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { Ready, Turn, P_GameConfig, P_GameConfigData, Role, PayoutManager, RakeRecipient } from "codegen/index.sol";
import { ERole } from "codegen/common.sol";

import { StandardDelegationsModule } from "@latticexyz/world-modules/src/modules/std-delegations/StandardDelegationsModule.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { WithdrawRakeSystem } from "systems/WithdrawRakeSystem.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ADMIN_NAMESPACE_ID } from "src/constants.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    // Load data from environment variables (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address payoutManagerAddress = vm.envAddress("PAYOUT_MANAGER_ADDRESS");
    address rakeRecipientAddress = vm.envAddress("RAKE_RECIPIENT_ADDRESS");
    // Load the first match start block from the `FIRST_MATCH_START_BLOCK` environment variable (in .env)
    uint256 firstMatchStartBlock = vm.envUint("FIRST_MATCH_START_BLOCK");
    console.log("block.number", block.number);
    require(firstMatchStartBlock > block.number, "[PostDeploy] First match must start in the future");

    IWorld world = IWorld(worldAddress);
    console.log("world address:", worldAddress);

    vm.startBroadcast(deployerPrivateKey);
    StoreSwitch.setStoreAddress(worldAddress);

    world.installRootModule(new StandardDelegationsModule(), new bytes(0));

    createPrototypes(world);
    console.log("Prototypes created");

    require(payoutManagerAddress != address(0), "PayoutManager address not set");
    PayoutManager.setContractAddress(payoutManagerAddress);

    require(rakeRecipientAddress != address(0), "RakeRecipient address not set");
    RakeRecipient.setRecipientAddress(rakeRecipientAddress);

    P_GameConfigData memory config = P_GameConfig.get();

    P_GameConfig.setGameStartBlock(firstMatchStartBlock);
    P_GameConfig.setGameOverBlock(firstMatchStartBlock + config.nextGameLengthTurns * config.turnLengthBlocks);

    createPlanets();
    LibShieldEater.initialize();
    initPrice();
    Turn.setNextTurnBlock(firstMatchStartBlock + config.turnLengthBlocks);

    // register the admin namespace that stores raked eth
    world.registerNamespace(ADMIN_NAMESPACE_ID);

    ResourceId withdrawSystemId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(ADMIN_NAMESPACE_ID),
      name: "WithdrawRakeSyst"
    });
    WithdrawRakeSystem withdrawSystem = new WithdrawRakeSystem();
    world.registerSystem(withdrawSystemId, withdrawSystem, true);
    world.registerFunctionSelector(withdrawSystemId, "withdrawRake()");

    address adminAddress = vm.addr(deployerPrivateKey);
    Role.set(adminAddress, ERole.Admin);

    address keeperAddress = vm.envAddress("KEEPER_ADDRESS");
    if (adminAddress != keeperAddress) {
      Role.set(keeperAddress, ERole.CanUpdate);
    }
    // must be set after post deploy to avoid race condition
    Ready.set(true);
    vm.stopBroadcast();
  }
}
