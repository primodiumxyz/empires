// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { ResourceIds } from "@latticexyz/store/src/codegen/index.sol";
import { NamespaceOwner, ResourceAccess } from "@latticexyz/world/src/codegen/index.sol";

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { coordToId } from "src/utils.sol";
import { Planet, PlanetData } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { ADMIN_NAMESPACE_ID } from "src/constants.sol";

contract PostDeployTest is PrimodiumTest {
  function setUp() public override {
    super.setUp();
  }
  function testRegisterAdminNamespace() public {
    // Expect the caller to be the namespace owner
    assertEq(NamespaceOwner.get(ADMIN_NAMESPACE_ID), creator, "caller should be namespace owner");

    // Expect the caller to have access
    assertEq(ResourceAccess.get(ADMIN_NAMESPACE_ID, creator), true, "caller should have access");

    // Expect the resource ID to have been registered
    assertTrue(ResourceIds.getExists(ADMIN_NAMESPACE_ID));
  }
}
