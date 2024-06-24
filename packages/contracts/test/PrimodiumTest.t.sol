// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import "forge-std/Test.sol";
import { idToAddress, addressToId } from "src/utils.sol";
import { WorldResourceIdLib } from "@latticexyz/world/src/WorldResourceId.sol";
import { MudTest } from "@latticexyz/world/test/MudTest.t.sol";
import { NamespaceOwner } from "@latticexyz/world/src/codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";

function toString(bytes32 id) pure returns (string memory) {
  return string(abi.encodePacked(id));
}

contract PrimodiumTest is MudTest {
  IWorld public world;
  uint256 userNonce = 0;

  address creator;
  address payable alice;
  address payable bob;
  address payable eve;

  function setUp() public virtual override {
    super.setUp();
    world = IWorld(worldAddress);
    address namespaceOwner = NamespaceOwner.get(WorldResourceIdLib.encodeNamespace(bytes14("Empires")));
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
}
