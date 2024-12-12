// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";

import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { RESOURCE_SYSTEM, RESOURCE_NAMESPACE } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";

import { P_GameConfig, WinningEmpire, Empire, P_PointConfig, Planet, OverrideCost } from "codegen/index.sol";
import { PayoutManager as PayoutManagerTable, RakeRecipient } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";

import { PayoutSystem } from "systems/PayoutSystem.sol";

import { PointsMap } from "adts/PointsMap.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";

import { LibPrice } from "libraries/LibPrice.sol";

import { addressToId } from "src/utils.sol";

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";

import { PayoutManager as PayoutManagerContract } from "payman/src/PayoutManager.sol";

contract PayoutSystemTest is PrimodiumTest {
  PayoutManagerContract payoutManagerContract;
  address payoutManagerAddress;

  bytes32 planetId;
  uint256 turnLength = 100;
  uint256 value = 100 ether;

  bytes32 planetIdRed;
  bytes32 planetIdGreen;
  bytes32 planetIdBlue;

  function setUp() public override {
    super.setUp();

    payoutManagerAddress = PayoutManagerTable.get();
    payoutManagerContract = PayoutManagerContract(payoutManagerAddress);

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

  function testTest() public pure {
    assertTrue(true);
  }

  function testGetWinners() public {
    // game started
    // players take some actions to generate points
    uint256 totalCost = LibPrice.getTotalCost(EOverride.AirdropGold, EEmpire.Green, 1);

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
    uint256 startblock = P_GameConfig.getGameStartBlock();
    vm.roll(startblock + 1);
    // players take some actions to generate points

    buyAirdropGold(alice, EEmpire.Red, 1);
    buyAirdropGold(alice, EEmpire.Green, 2);
    buyAirdropGold(alice, EEmpire.Blue, 2);

    buyAirdropGold(bob, EEmpire.Red, 1);
    buyAirdropGold(bob, EEmpire.Green, 3);
    buyAirdropGold(bob, EEmpire.Blue, 1);

    buyAirdropGold(eve, EEmpire.Green, 1);

    // end the game
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    vm.roll(endBlock + 1);

    // set a winning empire
    WinningEmpire.set(EEmpire.Green);

    uint256 empireBalanceBefore = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 adminBalanceBefore = Balances.get(ADMIN_NAMESPACE_ID);
    uint256 payoutManagerBalanceBefore = address(payoutManagerContract).balance;
    console.log("empireBalance", empireBalanceBefore);
    console.log("adminBalance", adminBalanceBefore);
    console.log("payoutManagerBalance", payoutManagerBalanceBefore);

    world.Empires__distributeFunds();

    uint256 empireBalanceAfter = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 adminBalanceAfter = Balances.get(ADMIN_NAMESPACE_ID);
    uint256 payoutManagerBalanceAfter = address(payoutManagerContract).balance;
    console.log("empireBalance", empireBalanceAfter);
    console.log("adminBalance", adminBalanceAfter);
    console.log("payoutManagerBalance", payoutManagerBalanceAfter);

    assertEq(empireBalanceAfter, 0);
    assertEq(adminBalanceAfter, 0);
    assertEq(payoutManagerBalanceAfter, empireBalanceBefore + adminBalanceBefore);

    // get winners
    PayoutManagerContract.Winner[] memory winners = payoutManagerContract.winnersByRound(1);
    console.log("winner count", winners.length);

    uint256 payoutSum = 0;
    for (uint i = 0; i < winners.length; i++) {
      console.log("winner", winners[i].winner);
      console.log("payout", winners[i].payout);
      payoutSum += winners[i].payout;
    }

    assertApproxEqRel(payoutSum, empireBalanceBefore + adminBalanceBefore, .001e18);
  }

  function buyAirdropGold(address player, EEmpire empire, uint256 quantity) public {
    vm.stopPrank();

    uint256 totalCost = LibPrice.getTotalCost(EOverride.AirdropGold, empire, quantity);

    vm.startPrank(player);
    world.Empires__airdropGold{ value: totalCost }(empire, quantity);
    vm.stopPrank();
    vm.startPrank(creator);
  } // retrieve the funds to this contract

  receive() external payable {}
}
