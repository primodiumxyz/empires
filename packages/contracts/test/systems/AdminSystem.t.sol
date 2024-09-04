// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Ready, Role } from "codegen/index.sol";
import { ERole } from "codegen/common.sol";
import { AdminSystem } from "systems/AdminSystem.sol";

contract AdminSystemTest is PrimodiumTest {
  address admin;
  address user;

  function setUp() public override {
    super.setUp();
    admin = alice;
    user = bob;

    // Set up the test contract as an admin
    vm.prank(creator);
    Role.set(admin, ERole.Admin);
  }

  function testPause() public {
    vm.prank(admin);
    world.Empires__pause();
    assertFalse(Ready.get(), "Game should be paused");
  }

  function testUnpause() public {
    // First pause the game
    vm.prank(admin);
    world.Empires__pause();

    // Then unpause
    vm.prank(admin);
    world.Empires__unpause();
    assertTrue(Ready.get(), "Game should be unpaused");
  }

  function testSetRole() public {
    vm.prank(admin);
    world.Empires__setRole(user, ERole.Admin);
    assertEq(uint8(Role.get(user)), uint8(ERole.Admin), "User should be assigned Admin role");
  }

  function testRemoveRole() public {
    // First set a role
    vm.prank(admin);
    world.Empires__setRole(user, ERole.Admin);

    // Then remove it
    vm.prank(admin);
    world.Empires__removeRole(user);
    assertEq(uint8(Role.get(user)), uint8(ERole.NULL), "User's role should be removed");
  }

  function testPauseNonAdmin() public {
    vm.prank(user);
    vm.expectRevert("[EmpiresSystem] Only admin");
    world.Empires__pause();
  }

  function testUnpauseNonAdmin() public {
    vm.prank(user);
    vm.expectRevert("[EmpiresSystem] Only admin");
    world.Empires__unpause();
  }

  function testSetRoleNonAdmin() public {
    vm.prank(user);
    vm.expectRevert("[EmpiresSystem] Only admin");
    world.Empires__setRole(user, ERole.Admin);
  }

  function testRemoveRoleNonAdmin() public {
    vm.prank(user);
    vm.expectRevert("[EmpiresSystem] Only admin");
    world.Empires__removeRole(user);
  }

  function testSetInvalidRole() public {
    vm.prank(admin);
    vm.expectRevert("[AdminSystem] Invalid role");
    world.Empires__setRole(user, ERole.NULL);
  }

  function testInitialAdmin() public {
    assertEq(uint8(Role.get(creator)), uint8(ERole.Admin), "Creator should be admin");
  }
}
