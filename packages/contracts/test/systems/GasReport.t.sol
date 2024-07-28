// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { Turn, P_NPCActionThresholds, P_NPCActionCosts, Turn, P_GameConfig, Planet, P_PointConfig, P_PointConfigData, P_ActionConfig, P_ActionConfigData, ActionCost, Empire } from "codegen/index.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { EEmpire, ENPCAction, EPlayerAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { addressToId } from "src/utils.sol";

contract GasReport is PrimodiumTest {
  bytes32 planetId;
  bytes32 creatorId;
  uint256 turnLength = 100;
  uint256 initGas;
  uint256 pointUnit;
  function setUp() public override {
    super.setUp();

    vm.startPrank(creator);
    creatorId = addressToId(creator);
    P_GameConfig.setTurnLengthBlocks(turnLength);
    P_GameConfig.setGameOverBlock(block.number + 100000);
    uint256 i = 0;
    do {
      planetId = PlanetsSet.getPlanetIds()[i];
      i++;
    } while (Planet.getEmpireId(planetId) == EEmpire.NULL);
    pointUnit = P_PointConfig.getPointUnit();
  }
  function startGasReport(string memory name) public view returns (uint256) {
    uint256 gasLeft = gasleft();
    console.log(name);
    return gasLeft;
  }

  function endGasReport(uint256 startingGas) public view {
    console.log("Gas used: ", startingGas - gasleft());
  }

  function testGasUpdateWorld() public {
    initGas = startGasReport("First update world");
    world.Empires__updateWorld();
    endGasReport(initGas);
    uint256 maxGasUsed = 0;
    console.log("Highest gas in 100 turns");
    for (uint256 i = 0; i < 100; i++) {
      vm.roll(block.number + P_GameConfig.getTurnLengthBlocks());
      initGas = gasleft();
      world.Empires__updateWorld();
      uint256 gasUsed = initGas - gasleft();
      if (gasUsed > maxGasUsed) {
        maxGasUsed = gasUsed;
      }
    }
    console.log("Max gas used: ", maxGasUsed);
  }

  function testGasCreateShipMultiple() public {
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.CreateShip, Planet.getEmpireId(planetId), true, 1);
    initGas = startGasReport("Create 1 ship");
    world.Empires__createShip{ value: cost }(planetId, 1);
    endGasReport(initGas);

    cost = LibPrice.getTotalCost(EPlayerAction.CreateShip, Planet.getEmpireId(planetId), true, 10);
    initGas = startGasReport("Create 10 ships");
    world.Empires__createShip{ value: cost }(planetId, 10);
    endGasReport(initGas);
  }

  function testGasKillShipMultiple() public {
    Planet.setShipCount(planetId, 11);

    uint256 cost = LibPrice.getTotalCost(EPlayerAction.KillShip, Planet.getEmpireId(planetId), false, 1);
    initGas = startGasReport("Kill 1 ship");
    world.Empires__killShip{ value: cost }(planetId, 1);
    endGasReport(initGas);

    cost = LibPrice.getTotalCost(EPlayerAction.KillShip, Planet.getEmpireId(planetId), false, 10);
    initGas = startGasReport("Kill 10 ships");
    world.Empires__killShip{ value: cost }(planetId, 10);
    endGasReport(initGas);
  }

  function testGasChargeShieldMultiple() public {
    Planet.setShieldCount(planetId, 0);
    uint256 cost = LibPrice.getTotalCost(EPlayerAction.ChargeShield, Planet.getEmpireId(planetId), true, 1);
    initGas = startGasReport("Charge 1 shield");
    world.Empires__chargeShield{ value: cost }(planetId, 1);
    endGasReport(initGas);

    cost = LibPrice.getTotalCost(EPlayerAction.ChargeShield, Planet.getEmpireId(planetId), true, 10);
    initGas = startGasReport("Charge 10 shields");
    world.Empires__chargeShield{ value: cost }(planetId, 10);
    endGasReport(initGas);
  }

  function testGasDrainShieldMultiple() public {
    Planet.setShieldCount(planetId, 11);

    uint256 cost = LibPrice.getTotalCost(EPlayerAction.DrainShield, Planet.getEmpireId(planetId), false, 1);
    initGas = startGasReport("Drain 1 shield");
    world.Empires__drainShield{ value: cost }(planetId, 1);
    endGasReport(initGas);

    cost = LibPrice.getTotalCost(EPlayerAction.DrainShield, Planet.getEmpireId(planetId), false, 10);
    initGas = startGasReport("Drain 10 shields");
    world.Empires__drainShield{ value: cost }(planetId, 10);
    endGasReport(initGas);
  }

  function testGasSellPoints() public {
    EEmpire empire = Planet.getEmpireId(planetId);
    testGasCreateShipMultiple();

    initGas = startGasReport("Sell 1 point");
    world.Empires__sellPoints(empire, 1 * pointUnit);
    endGasReport(initGas);

    uint256 remainingPoints = PointsMap.get(empire, creatorId);

    initGas = startGasReport("Sell all points");
    world.Empires__sellPoints(empire, remainingPoints);
    endGasReport(initGas);
  }
}