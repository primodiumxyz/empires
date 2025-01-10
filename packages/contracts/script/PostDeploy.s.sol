// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Vm } from "forge-std/Vm.sol";
import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { createPrototypes } from "codegen/Prototypes.sol";
import { createPlanets } from "codegen/scripts/CreatePlanets.sol";
import { LibShieldEater } from "libraries/LibShieldEater.sol";
import { initPrice } from "libraries/InitPrice.sol";
import { Ready, Turn, P_GameConfig, P_GameConfigData, Role, PayoutManager as PayoutManagerTable, RakeRecipient } from "codegen/index.sol";
import { ERole } from "codegen/common.sol";

import { StandardDelegationsModule } from "@latticexyz/world-modules/src/modules/std-delegations/StandardDelegationsModule.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { PayoutSystem } from "systems/PayoutSystem.sol";
import { RESOURCE_SYSTEM } from "@latticexyz/world/src/worldResourceTypes.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

import { PayoutManager as PayoutManagerContract } from "payman/src/PayoutManager.sol";

contract PostDeploy is Script {
  string constant PAYMAN_PATH = "./payman.json";
  PayoutManagerContract payoutManagerContract;

  function run(address worldAddress) external {
    /*//////////////////////////////////////////////////////////////
                            ENV VARIABLES
    //////////////////////////////////////////////////////////////*/

    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    address rakeRecipientAddress = vm.envAddress("RAKE_RECIPIENT_ADDRESS");
    uint256 roundStart = vm.envUint("GAME_START_BLOCK");

    /*//////////////////////////////////////////////////////////////
                            PAYOUT MANAGER
    //////////////////////////////////////////////////////////////*/
    address payoutManagerAddress = getPaymanAddress();

    if (payoutManagerAddress == address(0)) {
      vm.startBroadcast(deployerPrivateKey);
      console.log("Deploying PayoutManager...");
      payoutManagerContract = new PayoutManagerContract();
      vm.stopBroadcast();

      payoutManagerAddress = address(payoutManagerContract);
      string memory obj1 = "top";
      string memory obj2 = "item";
      string memory output = vm.serializeAddress(obj2, "ADDRESS", payoutManagerAddress);

      string memory finalJson = vm.serializeString(obj1, vm.toString(block.chainid), output);
      vm.writeJson(finalJson, PAYMAN_PATH);
    } else {
      console.log("Existing PayoutManager found");
      payoutManagerContract = PayoutManagerContract(payoutManagerAddress);
    }
    console.log("[PAYMAN]", payoutManagerAddress);

    /*//////////////////////////////////////////////////////////////
                            EMPIRES
    //////////////////////////////////////////////////////////////*/

    console.log("block.number", block.number);
    require(roundStart > block.number, "[PostDeploy] First match must start in the future");

    IWorld world = IWorld(worldAddress);
    console.log("world address:", worldAddress);

    vm.startBroadcast(deployerPrivateKey);
    StoreSwitch.setStoreAddress(worldAddress);

    world.installRootModule(new StandardDelegationsModule(), new bytes(0));

    createPrototypes(world);
    console.log("Prototypes created");

    require(payoutManagerAddress != address(0), "PayoutManager address not set");
    PayoutManagerTable.setContractAddress(payoutManagerAddress);

    require(rakeRecipientAddress != address(0), "RakeRecipient address not set");
    RakeRecipient.setRecipientAddress(rakeRecipientAddress);

    P_GameConfigData memory config = P_GameConfig.get();

    P_GameConfig.setGameStartBlock(roundStart);
    P_GameConfig.setGameOverBlock(roundStart + config.nextGameLengthTurns * config.turnLengthBlocks);

    createPlanets();
    LibShieldEater.initialize();
    initPrice();
    Turn.setNextTurnBlock(roundStart + config.turnLengthBlocks);

    // register the admin namespace that stores raked eth
    world.registerNamespace(ADMIN_NAMESPACE_ID);

    address adminAddress = vm.addr(deployerPrivateKey);
    Role.set(adminAddress, ERole.Admin);

    address keeperAddress = vm.envAddress("KEEPER_ADDRESS");
    if (adminAddress != keeperAddress) {
      Role.set(keeperAddress, ERole.CanUpdate);
    }

    ResourceId payoutSystemId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(EMPIRES_NAMESPACE_ID),
      name: "PayoutSystem"
    });

    address payoutSystemAddress = Systems.getSystem(payoutSystemId);
    world.grantAccess(ADMIN_NAMESPACE_ID, payoutSystemAddress);

    payoutManagerContract.setPayoutSystem(payoutSystemAddress);

    // must be set after post deploy to avoid race condition
    Ready.set(true);
    vm.stopBroadcast();
  }

  function getPaymanAddress() internal returns (address) {
    address paymanAddress = address(0);
    if (!vm.isFile(PAYMAN_PATH)) {
      return paymanAddress;
    }

    string memory paymanJson = vm.readFile(PAYMAN_PATH);
    string memory chainIdString = string.concat(".", vm.toString(block.chainid));
    bool chainIdExists = vm.keyExistsJson(paymanJson, chainIdString);
    if (chainIdExists) {
      string[] memory keys = vm.parseJsonKeys(paymanJson, chainIdString);
      string memory addressKeyString = string.concat(chainIdString, string.concat(".", keys[0]));
      bool addressExists = vm.keyExistsJson(paymanJson, addressKeyString);
      if (addressExists) {
        paymanAddress = vm.parseJsonAddress(paymanJson, addressKeyString);
      } else {
        console.log("[PAYMAN] address not found");
      }
    } else {
      console.log("[PAYMAN] chainId not found");
    }

    if (paymanAddress != address(0)) {
      if (paymanAddress.code.length == 0) {
        console.log("[PAYMAN] No contract at address");
        paymanAddress = address(0);
      }
    }
    return paymanAddress;
  }
}
