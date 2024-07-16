// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPrototypes } from "codegen/Prototypes.sol";
import { createPlanets } from "libraries/CreatePlanets.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { P_GameConfig } from "codegen/index.sol";

import { StandardDelegationsModule } from "@latticexyz/world-modules/src/modules/std-delegations/StandardDelegationsModule.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { WithdrawRakeSystem } from "systems/WithdrawRakeSystem.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ADMIN_NAMESPACE_ID } from "src/constants.sol";

contract PostDeploy is Script {
  function run(address worldAddress) external {
    // Load the private key from the `PRIVATE_KEY` environment variable (in .env)
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

    IWorld world = IWorld(worldAddress);
    console.log("world address:", worldAddress);
    vm.startBroadcast(deployerPrivateKey);
    StoreSwitch.setStoreAddress(worldAddress);

    world.installRootModule(new StandardDelegationsModule(), new bytes(0));

    createPrototypes(world);
    console.log("Prototypes created");

    P_GameConfig.setGameOverBlock(block.number + 1_000);

    createPlanets();
    initPrice();

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

    vm.stopBroadcast();
  }
}
