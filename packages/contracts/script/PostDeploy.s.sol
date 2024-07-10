// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPrototypes } from "codegen/Prototypes.sol";
import { P_GameConfig } from "codegen/index.sol";
import { initPrice } from "./InitPrice.s.sol";
import { createPlanets } from "libraries/CreatePlanets.sol";

import { StandardDelegationsModule } from "@latticexyz/world-modules/src/modules/std-delegations/StandardDelegationsModule.sol";
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

    P_GameConfig.setGameOverBlock(block.number + 100_000);

    createPlanets();
    initPrice();

    // register the admin namespace that stores raked eth
    world.registerNamespace(ADMIN_NAMESPACE_ID);

    vm.stopBroadcast();
  }
}
