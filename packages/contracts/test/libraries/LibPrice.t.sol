// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { Empire, Player, ActionCost, P_PointConfig, P_PointConfigData, P_ActionConfig, P_ActionConfigData } from "codegen/index.sol";
import { EEmpire, EPlayerAction } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { EMPIRE_COUNT } from "src/constants.sol";

contract LibPriceTest is PrimodiumTest {
  P_PointConfigData config;
  P_ActionConfigData actionConfig;
  uint256 pointUnit;
  function setUp() public override {
    super.setUp();
    config = P_PointConfig.get();
    actionConfig = P_ActionConfig.get();
    pointUnit = config.pointUnit;
  }

  function testStartGetMarginalActionCost() public {
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.CreateShip, true, 1),
      actionConfig.startActionCost,
      "Starting Red Empire marginal action cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Blue, EPlayerAction.CreateShip, true, 1),
      actionConfig.startActionCost,
      "Starting Blue Empire marginal action cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Green, EPlayerAction.CreateShip, true, 1),
      actionConfig.startActionCost,
      "Starting Green Empire marginal action cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.CreateShip, false, 1),
      (actionConfig.startActionCost * actionConfig.regressMultiplier) / 10000,
      "Starting Red Empire regressive marginal action cost incorrect"
    );
  }

  function testGetTwoMarginalActionCost() public {
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.CreateShip, true, 2),
      actionConfig.startActionCost + (actionConfig.startActionCost + actionConfig.actionCostIncrease),
      "Red Empire marginal action cost for 2 actions incorrect"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Blue, EPlayerAction.CreateShip, true, 2),
      actionConfig.startActionCost + (actionConfig.startActionCost + actionConfig.actionCostIncrease),
      "Blue Empire marginal action cost for 2 actions incorrect"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Green, EPlayerAction.CreateShip, true, 2),
      actionConfig.startActionCost + (actionConfig.startActionCost + actionConfig.actionCostIncrease),
      "Green Empire marginal action cost for 2 actions incorrect"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.CreateShip, false, 2),
      ((actionConfig.startActionCost + (actionConfig.startActionCost + actionConfig.actionCostIncrease)) * actionConfig.regressMultiplier) / 10000,
      "Red Empire regressive marginal action cost for 2 actions incorrect"
    );
  }

  function testStartGetPointCost() public {
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit),
      config.startPointCost,
      "Starting Red Empire point cost incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 1 * pointUnit),
      config.startPointCost,
      "Starting Blue Empire point cost incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 1 * pointUnit),
      config.startPointCost,
      "Starting Green Empire point cost incorrect"
    );
  }

  function testGetTwoPointsCost() public {
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 2 * pointUnit),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Red Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 2 * pointUnit),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Blue Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 2 * pointUnit),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Green Empire point cost for 2 points incorrect"
    );
  }

  function testGetRegressPointCostSingle() public {
    uint256 initPointCost = config.startPointCost;
    uint256 points = initPointCost * (EMPIRE_COUNT - 1);
    assertEq(LibPrice.getRegressPointCost(EEmpire.Red, 1), points, "Red Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(EEmpire.Blue, 1), points, "Blue Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(EEmpire.Green, 1), points, "Green Empire point cost for 2 points incorrect");
  }

  function testGetRegressPointCostMultiple() public {
    assertEq(
      LibPrice.getRegressPointCost(EEmpire.Red, 2),
      LibPrice.getPointCost(EEmpire.Red, 2 * pointUnit) * (EMPIRE_COUNT - 1),
      "Red Empire point cost for 2 bulk actions incorrect"
    );
  }

  function testGetProgressPointCostSingle() public {
    uint256 initPointCost = config.startPointCost;
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Red, 1),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Red Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Blue, 1),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Blue Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Green, 1),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Green Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
  }

  function testGetProgressPointCostMultiple() public {
    uint256 initPointCost = config.startPointCost;
    assertEq(
      LibPrice.getProgressPointCost(EEmpire.Red, 2),
      2 * (EMPIRE_COUNT - 1) * (initPointCost + ((2 * EMPIRE_COUNT - 3) * config.pointCostIncrease) / 2),
      "Red Empire point cost for 2 bulk actions incorrect"
    );
  }

  function testGetTotalCostProgressSingle() public {
    assertEq(
      LibPrice.getTotalCost(EPlayerAction.CreateShip, EEmpire.Red, true, 1),
      actionConfig.startActionCost + LibPrice.getProgressPointCost(EEmpire.Red, 1),
      "Total cost for single action Red Empire incorrect"
    );
  }

  function testGetTotalCostProgressMultiple() public {
    assertEq(
      LibPrice.getTotalCost(EPlayerAction.CreateShip, EEmpire.Red, true, 2),
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.CreateShip, true, 2) +
        LibPrice.getProgressPointCost(EEmpire.Red, 2),
      "Total cost for multiple actions Red Empire incorrect"
    );
  }

  function testGetTotalCostRegressSingle() public {
    assertEq(
      LibPrice.getTotalCost(EPlayerAction.KillShip, EEmpire.Red, false, 1),
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.KillShip, false, 1) +
        LibPrice.getRegressPointCost(EEmpire.Red, 1),
      "Total cost for single action Red Empire incorrect"
    );
  }

  function testGetTotalCostRegressMultiple() public {
    assertEq(
      LibPrice.getTotalCost(EPlayerAction.KillShip, EEmpire.Red, false, 2),
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.KillShip, false, 2) +
        LibPrice.getRegressPointCost(EEmpire.Red, 2),
      "Total cost for multiple actions Red Empire incorrect"
    );
  }

  function testPointCostUp() public {
    vm.startPrank(creator);
    uint256 beginPointCost = LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit);
    LibPrice.pointCostUp(EEmpire.Red, 1 * pointUnit);
    uint256 nextPointCost = LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit);
    assertEq(nextPointCost, beginPointCost + config.pointCostIncrease, "First point cost increase incorrect");
    LibPrice.pointCostUp(EEmpire.Red, 1 * pointUnit);
    uint256 finalPointCost = LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit);
    assertEq(finalPointCost, nextPointCost + config.pointCostIncrease, "Second point cost increase incorrect");
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 1 * pointUnit),
      config.startPointCost,
      "Blue Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 1 * pointUnit),
      config.startPointCost,
      "Green Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 2 * pointUnit),
      finalPointCost * 2 + config.pointCostIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testActionCostUp() public {
    vm.startPrank(creator);
    uint256 beginActionCost = ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip);
    LibPrice.actionCostUp(EEmpire.Red, EPlayerAction.CreateShip, 1);
    uint256 nextActionCost = ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip);
    assertEq(nextActionCost, beginActionCost + actionConfig.actionCostIncrease, "First action cost increase incorrect");
    LibPrice.actionCostUp(EEmpire.Red, EPlayerAction.CreateShip, 1);
    uint256 finalActionCost = ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip);
    assertEq(
      finalActionCost,
      nextActionCost + actionConfig.actionCostIncrease,
      "Second action cost increase incorrect"
    );
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.KillShip),
      actionConfig.startActionCost,
      "Red Empire's other action costs should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.CreateShip),
      actionConfig.startActionCost,
      "Blue Empire's other action costs should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateShip),
      actionConfig.startActionCost,
      "Green Empire's other action costs should not change"
    );
    assertEq(
      LibPrice.getMarginalActionCost(EEmpire.Red, EPlayerAction.CreateShip, true, 2),
      finalActionCost * 2 + actionConfig.actionCostIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testEmpirePointCostDown() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate);
    Empire.setPointCost(EEmpire.Blue, config.minPointCost + config.pointGenRate);
    Empire.setPointCost(EEmpire.Green, config.minPointCost + config.pointGenRate);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Empire.getPointCost(EEmpire.Red),
      config.minPointCost,
      "Red Empire point cost down incorrect when matching gen rate"
    );
    assertEq(
      Empire.getPointCost(EEmpire.Blue),
      config.minPointCost + config.pointGenRate,
      "Blue Empire point cost should not change"
    );
    assertEq(
      Empire.getPointCost(EEmpire.Green),
      config.minPointCost + config.pointGenRate,
      "Green Empire point cost should not change"
    );

    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate - 1);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Empire.getPointCost(EEmpire.Red),
      config.minPointCost,
      "Red Empire point cost down incorrect when less than gen rate"
    );

    Empire.setPointCost(EEmpire.Red, config.minPointCost);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Empire.getPointCost(EEmpire.Red),
      config.minPointCost,
      "Red Empire point cost down incorrect when at min cost"
    );

    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate + 1);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Empire.getPointCost(EEmpire.Red),
      config.minPointCost + 1,
      "Red Empire point cost down incorrect when greater than gen rate"
    );

    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointGenRate * 2 + 1);
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(
      Empire.getPointCost(EEmpire.Red),
      config.minPointCost + config.pointGenRate + 1,
      "Red Empire point cost down incorrect when much greater than gen rate"
    );
    LibPrice.turnEmpirePointCostDown(EEmpire.Red);
    assertEq(Empire.getPointCost(EEmpire.Red), config.minPointCost + 1, "Sequential Point cost down not working");

    assertEq(
      Empire.getPointCost(EEmpire.Blue),
      config.minPointCost + config.pointGenRate,
      "Blue Empire point cost should remain unchanged"
    );
    assertEq(
      Empire.getPointCost(EEmpire.Green),
      config.minPointCost + config.pointGenRate,
      "Green Empire point cost should remain unchanged"
    );

    LibPrice.turnEmpirePointCostDown(EEmpire.Green);
    assertEq(
      Empire.getPointCost(EEmpire.Green),
      config.minPointCost,
      "Empire point cost down incorrect when different empire"
    );
    assertEq(
      Empire.getPointCost(EEmpire.Red),
      config.minPointCost + 1,
      "Red Empire point cost should remain unchanged"
    );
  }

  function testEmpirePlayerActionsCostDown() public {
    vm.startPrank(creator);
    ActionCost.set(EEmpire.Red, EPlayerAction.CreateShip, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(EEmpire.Red, EPlayerAction.KillShip, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(EEmpire.Blue, EPlayerAction.CreateShip, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(EEmpire.Blue, EPlayerAction.KillShip, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(EEmpire.Green, EPlayerAction.CreateShip, actionConfig.minActionCost + actionConfig.actionGenRate);
    ActionCost.set(EEmpire.Green, EPlayerAction.KillShip, actionConfig.minActionCost + actionConfig.actionGenRate);

    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost,
      "Red Empire action cost down incorrect when matching gen rate"
    );
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.KillShip),
      actionConfig.minActionCost,
      "Red Empire action cost down should affect all actions of the empire"
    );
    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.CreateShip),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Blue Empire action cost should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.KillShip),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Blue Empire action cost should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateShip),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Green Empire action cost should not change"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.KillShip),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Green Empire action cost should not change"
    );

    ActionCost.set(EEmpire.Red, EPlayerAction.CreateShip, actionConfig.minActionCost + actionConfig.actionGenRate - 1);
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost,
      "Red Empire action cost down incorrect when less than gen rate"
    );

    ActionCost.set(EEmpire.Red, EPlayerAction.CreateShip, actionConfig.minActionCost);
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost,
      "Red Empire action cost down incorrect when at min cost"
    );

    ActionCost.set(EEmpire.Red, EPlayerAction.CreateShip, actionConfig.minActionCost + actionConfig.actionGenRate + 1);
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost + 1,
      "Red Empire action cost down incorrect when greater than gen rate"
    );

    ActionCost.set(
      EEmpire.Red,
      EPlayerAction.CreateShip,
      actionConfig.minActionCost + actionConfig.actionGenRate * 2 + 1
    );
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost + actionConfig.actionGenRate + 1,
      "Red Empire action cost down incorrect when much greater than gen rate"
    );
    LibPrice.empirePlayerActionsCostDown(EEmpire.Red);
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost + 1,
      "Sequential Action cost down not working"
    );

    assertEq(
      ActionCost.get(EEmpire.Blue, EPlayerAction.CreateShip),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Blue Empire action cost should remain unchanged"
    );
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateShip),
      actionConfig.minActionCost + actionConfig.actionGenRate,
      "Green Empire action cost should remain unchanged"
    );

    LibPrice.empirePlayerActionsCostDown(EEmpire.Green);
    assertEq(
      ActionCost.get(EEmpire.Green, EPlayerAction.CreateShip),
      actionConfig.minActionCost,
      "Empire action cost down incorrect when different empire"
    );
    assertEq(
      ActionCost.get(EEmpire.Red, EPlayerAction.CreateShip),
      actionConfig.minActionCost + 1,
      "Red Empire action cost should remain unchanged"
    );
  }

  function testFailGetPointSaleValueMinPrice() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost);
    vm.expectRevert();
    LibPrice.getPointSaleValue(EEmpire.Red, 1);
  }

  function testFailGetPointSaleValueOversoldSingle() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.getPointSaleValue(EEmpire.Red, 1);
  }

  function testFailGetPointSaleValueOversoldMultiple() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + 2 * config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.getPointSaleValue(EEmpire.Red, 2);
  }

  function testGetPointSaleValueNoTax() public {
    vm.startPrank(creator);
    config.pointSellTax = 0;
    P_PointConfig.set(config);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointCostIncrease);
    Empire.setPointCost(EEmpire.Blue, config.minPointCost + config.pointCostIncrease + 1);
    Empire.setPointCost(EEmpire.Green, config.minPointCost + config.pointCostIncrease * 2);

    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Red, 1 * pointUnit),
      config.minPointCost,
      "Red Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Blue, 1 * pointUnit),
      config.minPointCost + 1,
      "Blue Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 1 * pointUnit),
      config.minPointCost + config.pointCostIncrease,
      "Green Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 2 * pointUnit),
      config.minPointCost * 2 + config.pointCostIncrease,
      "Green Empire multiple point sale value incorrect"
    );
  }

  function testGetPointSaleValueWithTax() public {
    vm.startPrank(creator);
    config.pointSellTax = 1;
    uint256 sellTax = config.pointSellTax;
    P_PointConfig.set(config);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointCostIncrease);
    Empire.setPointCost(EEmpire.Blue, config.minPointCost + config.pointCostIncrease + 1);
    Empire.setPointCost(EEmpire.Green, config.minPointCost + config.pointCostIncrease * 2);

    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Red, 1 * pointUnit),
      config.minPointCost - sellTax,
      "Red Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Blue, 1 * pointUnit),
      config.minPointCost - sellTax + 1,
      "Blue Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 1 * pointUnit),
      config.minPointCost - sellTax + config.pointCostIncrease,
      "Green Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 2 * pointUnit),
      (config.minPointCost - sellTax) * 2 + config.pointCostIncrease,
      "Green Empire multiple point sale value incorrect"
    );
  }

  function testSellTaxLessThanIncrease() public {
    assertTrue(
      config.pointSellTax < config.pointCostIncrease,
      "Sell tax should be less than point cost increase in config"
    );
  }

  function testFailSellEmpirePointCostDownMinPrice() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost);
    vm.expectRevert();
    LibPrice.sellEmpirePointCostDown(EEmpire.Red, 1);
  }

  function testFailSellEmpirePointCostDownOversoldSingle() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.sellEmpirePointCostDown(EEmpire.Red, 1);
  }

  function testFailSellEmpirePointCostDownOversoldMultiple() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + 2 * config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.sellEmpirePointCostDown(EEmpire.Red, 2);
  }

  function testSellEmpirePointCostDownSingle() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Red, config.minPointCost + config.pointCostIncrease);
    Empire.setPointCost(EEmpire.Blue, config.minPointCost + config.pointCostIncrease + 1);
    Empire.setPointCost(EEmpire.Green, config.minPointCost + config.pointCostIncrease * 2);

    LibPrice.sellEmpirePointCostDown(EEmpire.Red, 1 * pointUnit);
    LibPrice.sellEmpirePointCostDown(EEmpire.Blue, 1 * pointUnit);
    LibPrice.sellEmpirePointCostDown(EEmpire.Green, 1 * pointUnit);

    assertEq(Empire.getPointCost(EEmpire.Red), config.minPointCost, "Red Empire point cost after sale incorrect");
    assertEq(Empire.getPointCost(EEmpire.Blue), config.minPointCost + 1, "Blue Empire point cost after sale incorrect");
    assertEq(
      Empire.getPointCost(EEmpire.Green),
      config.minPointCost + config.pointCostIncrease,
      "Green Empire point cost after sale incorrect"
    );
  }

  function testSellEmpirePointCostDownMultiple() public {
    vm.startPrank(creator);
    Empire.setPointCost(EEmpire.Green, config.minPointCost + config.pointCostIncrease * 2);
    LibPrice.sellEmpirePointCostDown(EEmpire.Green, 2 * pointUnit);
    assertEq(
      Empire.getPointCost(EEmpire.Green),
      config.minPointCost,
      "Green Empire point cost after multiple points sold incorrect"
    );
  }
}
