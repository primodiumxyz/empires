// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { RESOURCE_SYSTEM, RESOURCE_NAMESPACE } from "@latticexyz/world/src/worldResourceTypes.sol";
import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";
import { System } from "@latticexyz/world/src/System.sol";
import { ROOT_NAMESPACE, ROOT_NAME } from "@latticexyz/world/src/constants.sol";
import { ROOT_NAMESPACE_ID } from "@latticexyz/world/src/constants.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

import { addressToId } from "src/utils.sol";
import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, WinningEmpire, Empire, P_PointConfig, Planet } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { WithdrawRakeSystem } from "systems/WithdrawRakeSystem.sol";
import { Role } from "codegen/index.sol";
import { ERole } from "codegen/common.sol";

contract WithdrawRakeSystemTest is PrimodiumTest {
  bytes32 planetId;
  uint256 turnLength = 100;
  uint256 value = 100 ether;
  uint256 cost;
  ResourceId rakeSystemId;

  function setUp() public override {
    super.setUp();

    vm.startPrank(creator);
    uint i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);

    world.registerSystem(systemId, system, true);
    world.registerFunctionSelector(systemId, "echoValue()");

    P_PointConfig.setPointRake(5000);
    switchPrank(alice);
    cost = LibPrice.getTotalCost(EOverride.CreateShip, Planet.getEmpireId(planetId), 1);
    world.Empires__createShip{ value: cost }(planetId, 1);

    rakeSystemId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(ADMIN_NAMESPACE_ID),
      name: "WithdrawRakeSyst"
    });
  }

  function testWithdrawRakeNonAdmin() public {
    vm.expectRevert("[EmpiresSystem] Only admin");
    world.call(rakeSystemId, abi.encodeCall(WithdrawRakeSystem.withdrawRake, ()));
  }

  function testWithdrawRake() public {
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), cost / 2, "rake value correct");
    vm.deal(alice, 0);

    switchPrank(creator);
    Role.set(alice, ERole.Admin);
    switchPrank(alice);
    world.call(rakeSystemId, abi.encodeCall(WithdrawRakeSystem.withdrawRake, ()));

    assertEq(alice.balance, cost / 2, "alice balance");
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), 0, "admin balance");
  }

  function testWithdrawRakeCreator() public {
    switchPrank(creator);
    uint256 initialBalance = creator.balance;
    world.call(rakeSystemId, abi.encodeCall(WithdrawRakeSystem.withdrawRake, ()));
    assertEq(creator.balance, initialBalance + cost / 2, "creator balance");
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), 0, "admin balance");
  }
}
