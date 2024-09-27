// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";

import { RESOURCE_SYSTEM, RESOURCE_NAMESPACE } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { System } from "@latticexyz/world/src/System.sol";

import { idToAddress, addressToId } from "src/utils.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EEmpire } from "codegen/common.sol";
import { Planet } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";

function toString(bytes32 id) pure returns (string memory) {
  return string(abi.encodePacked(id));
}

contract WorldBalanceTestSystem is System {
  function echoValue() public payable returns (uint256) {
    return _msgValue();
  }
}

contract PrimodiumTest is MudTest {
  IWorld public world;
  uint256 userNonce = 0;

  address creator;
  address payable alice;
  address payable bob;
  address payable eve;

  WorldBalanceTestSystem public system = new WorldBalanceTestSystem();

  ResourceId public systemId =
    WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(EMPIRES_NAMESPACE_ID),
      name: "testSystem"
    });

  function setUp() public virtual override {
    super.setUp();
    world = IWorld(worldAddress);
    address namespaceOwner = NamespaceOwner.get(EMPIRES_NAMESPACE_ID);
    creator = namespaceOwner;

    alice = getUser();
    bob = getUser();
    eve = getUser();
  }

  function getUser() internal returns (address payable) {
    address payable user = payable(address(uint160(uint256(keccak256(abi.encodePacked(userNonce++))))));
    vm.deal(user, 100 ether);
    return user;
  }

  modifier prank(address prankster) {
    vm.startPrank(prankster);
    _;
    vm.stopPrank();
  }

  function switchPrank(address prankster) internal {
    vm.stopPrank();
    vm.startPrank(prankster);
  }

  function assertEq(EEmpire a, EEmpire b) internal {
    assertEq(uint8(a), uint8(b));
  }

  function assertEq(EEmpire a, EEmpire b, string memory message) internal {
    assertEq(uint8(a), uint8(b), message);
  }

  function sendEther(address from, uint256 value) internal {
    vm.stopPrank();

    vm.prank(from);
    world.call{ value: value }(systemId, abi.encodeCall(system.echoValue, ()));
  }

  function clearAllEmpirePlanets() public {
    vm.startPrank(creator);
    for (uint256 i = 0; i < uint256(EEmpire.LENGTH); i++) {
      EmpirePlanetsSet.clear(EEmpire(i));
    }
    bytes32[] memory planetIds = PlanetsSet.getPlanetIds();
    for (uint256 i = 0; i < planetIds.length; i++) {
      Planet.setEmpireId(planetIds[i], EEmpire.NULL);
    }
    vm.stopPrank();
  }

  function assignPlanetToEmpire(bytes32 planetId, EEmpire empire) public {
    vm.startPrank(creator);
    Planet.setEmpireId(planetId, empire);
    EmpirePlanetsSet.add(empire, planetId);
    vm.stopPrank();
  }
}
