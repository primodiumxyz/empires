// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";

import { addressToId } from "src/utils.sol";
import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { P_GameConfig, WinningEmpire, Empire, P_PointConfig, Planet, OverrideCost } from "codegen/index.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { LibPrice } from "libraries/LibPrice.sol";

import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { EEmpire, EOverride } from "codegen/common.sol";

import { PayoutManager } from "../mocks/PayoutManager.sol";
import { DeployPayoutManager } from "../../script/integration/DeployPayoutManager.s.sol";

import { PayoutSystem } from "systems/PayoutSystem.sol";
import { PayoutManager as PayoutManagerTable } from "codegen/index.sol";

contract PayoutSystemTest is PrimodiumTest {
  PayoutManager payman;

  bytes32 planetId;
  uint256 turnLength = 100;
  uint256 value = 100 ether;

  bytes32 planetIdRed;
  bytes32 planetIdGreen;
  bytes32 planetIdBlue;

  function setUp() public override {
    super.setUp();
    DeployPayoutManager deploy = new DeployPayoutManager();
    payman = deploy.run();

    uint256 i = 0;
    do {
      planetIdRed = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetIdRed) != EEmpire.Red);

    i = 0;
    do {
      planetIdGreen = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetIdGreen) != EEmpire.Green);

    i = 0;
    do {
      planetIdBlue = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetIdBlue) != EEmpire.Blue);

    // OWNER = payman.getOwner();

    vm.startPrank(creator);
    world.registerSystem(systemId, system, true);
    world.registerFunctionSelector(systemId, "echoValue()");
  }

  function testTest() public {
    assertTrue(true);
  }

  // payout manager actual address should match the one registered with the world
  function testPayoutManagerAddresses() public {
    address actual = address(payman);
    address stored = PayoutManagerTable.get();
    assertEq(actual, stored);
  }

  function testGetPaymanOwner() public {
    address owner = world.Empires__getPaymanOwner();
    console.log("owner", owner);
  }

  function testGetWinners() public {
    // game started
    // players take some actions to generate points
    uint256 totalCost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Green, 1);
    uint256 overrideCost = OverrideCost.get(EEmpire.Green, EOverride.AirdropGold);

    vm.startPrank(alice);
    world.Empires__airdropGold{ value: totalCost }(EEmpire.Green, 1);
    vm.stopPrank();
    vm.startPrank(creator);

    // end the game
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);

    // set a winning empire
    WinningEmpire.set(EEmpire.Green);

    // get winners
    (address[] memory winners, uint256[] memory payouts, uint256 pot) = world.Empires__getWinners();

    // output results
    console.log("pot", pot);
    uint256 rake = Balances.get(ADMIN_NAMESPACE_ID);
    console.log("rake", rake);
    console.log("winner count", winners.length);

    uint256 playerCount = PlayersMap.size();
    console.log("player count", playerCount);

    for (uint i = 0; i < winners.length; i++) {
      console.log("winner", winners[i]);
      console.log("payout", payouts[i]);
    }

    // assert results
    assertEq(winners.length, 1);
    assertEq(winners[0], address(alice));
    assertEq(payouts.length, 1);
    assertEq(payouts[0], pot);
  }

  function testDistributeFunds() public {
    // game started
    // players take some actions to generate points

    buyAirdropGold(alice, EEmpire.Red, 1);
    buyAirdropGold(alice, EEmpire.Green, 2);
    buyAirdropGold(alice, EEmpire.Blue, 2);

    buyAirdropGold(bob, EEmpire.Red, 1);
    buyAirdropGold(bob, EEmpire.Green, 1);
    buyAirdropGold(bob, EEmpire.Blue, 1);

    buyAirdropGold(eve, EEmpire.Green, 1);

    // end the game
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);

    // set a winning empire
    WinningEmpire.set(EEmpire.Green);

    // output results
    uint256 pot = Balances.get(EMPIRES_NAMESPACE_ID);
    console.log("pot", pot);
    uint256 rake = Balances.get(ADMIN_NAMESPACE_ID);
    console.log("rake", rake);
    uint256 playerCount = PlayersMap.size();
    console.log("player count", playerCount);

    world.Empires__distributeFunds();
  }

  function buyAirdropGold(address player, EEmpire empire, uint256 quantity) public {
    vm.stopPrank();

    uint256 totalCost = LibPrice.getTotalCost(EOverride.AirdropGold, empire, quantity);
    uint256 overrideCost = OverrideCost.get(empire, EOverride.AirdropGold);

    vm.startPrank(player);
    world.Empires__airdropGold{ value: totalCost }(empire, quantity);
    vm.stopPrank();
    vm.startPrank(creator);
  }
}
