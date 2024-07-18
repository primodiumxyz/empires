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
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { WithdrawRakeSystem } from "systems/WithdrawRakeSystem.sol";

contract WithdrawRakeSystemTest is PrimodiumTest {
  bytes32 planetId;
  uint256 turnLength = 100;
  uint256 value = 100 ether;

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
  }

  function testWithdrawRake() public {
    P_PointConfig.setPointRake(5000);
    switchPrank(alice);
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateShip, Planet.getEmpireId(planetId), true);
    world.Empires__createShip{ value: cost }(planetId);
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), cost / 2, "rake value correct");

    ResourceId systemId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(ADMIN_NAMESPACE_ID),
      name: "WithdrawRakeSyst"
    });
    vm.deal(alice, 0);
    world.call(systemId, abi.encodeCall(WithdrawRakeSystem.withdrawRake, ()));

    assertEq(alice.balance, cost / 2, "alice balance");
    assertEq(Balances.get(ADMIN_NAMESPACE_ID), 0, "admin balance");
  }
}
