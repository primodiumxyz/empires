// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";
import { P_GameConfig, Empire, OverrideCost, P_PointConfig, P_PointConfigData, P_OverrideConfig, P_OverrideConfigData } from "codegen/index.sol";
import { EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";

contract LibPriceTest is PrimodiumTest {
  P_PointConfigData config;
  P_OverrideConfigData createShipConfig;
  P_OverrideConfigData killShipConfig;
  uint256 pointUnit;
  uint8 EMPIRE_COUNT;
  function setUp() public override {
    super.setUp();
    config = P_PointConfig.get();
    pointUnit = config.pointUnit;
    createShipConfig = P_OverrideConfig.get(EOverride.CreateShip);
    killShipConfig = P_OverrideConfig.get(EOverride.KillShip);
    EMPIRE_COUNT = P_GameConfig.getEmpireCount();

    // Let's make the kill ship cost different than create ship
    killShipConfig.minOverrideCost = createShipConfig.minOverrideCost * 3;
    killShipConfig.startOverrideCost = createShipConfig.startOverrideCost * 3;
    killShipConfig.overrideGenRate = createShipConfig.overrideGenRate * 3;
    killShipConfig.overrideCostIncrease = createShipConfig.overrideCostIncrease * 3;
    vm.startPrank(creator);
    P_OverrideConfig.set(EOverride.KillShip, killShipConfig);

    // We need to reinitialize price for KillShip, as InitPrice.sol already ran
    OverrideCost.set(1, EOverride.KillShip, killShipConfig.startOverrideCost);
    OverrideCost.set(2, EOverride.KillShip, killShipConfig.startOverrideCost);
    OverrideCost.set(3, EOverride.KillShip, killShipConfig.startOverrideCost);
    vm.stopPrank();
  }

  function testStartGetMarginalOverrideCost() public {
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 1, 1),
      createShipConfig.startOverrideCost,
      "Starting Red Empire marginal override cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 2, 1),
      createShipConfig.startOverrideCost,
      "Starting Blue Empire marginal override cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 3, 1),
      createShipConfig.startOverrideCost,
      "Starting Green Empire marginal override cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.KillShip, 1, 1),
      killShipConfig.startOverrideCost,
      "Starting Red Empire regressive marginal override cost incorrect"
    );
  }

  function testGetTwoMarginalOverrideCost() public {
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 1, 2),
      createShipConfig.startOverrideCost + (createShipConfig.startOverrideCost + createShipConfig.overrideCostIncrease),
      "Red Empire marginal override cost for 2 overrides incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 2, 2),
      createShipConfig.startOverrideCost + (createShipConfig.startOverrideCost + createShipConfig.overrideCostIncrease),
      "Blue Empire marginal override cost for 2 overrides incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 3, 2),
      createShipConfig.startOverrideCost + (createShipConfig.startOverrideCost + createShipConfig.overrideCostIncrease),
      "Green Empire marginal override cost for 2 overrides incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.KillShip, 1, 2),
      killShipConfig.startOverrideCost + (killShipConfig.startOverrideCost + killShipConfig.overrideCostIncrease),
      "Red Empire regressive marginal override cost for 2 overrides incorrect"
    );
  }

  function testStartGetPointCost() public {
    uint256 initPointCost = Empire.getPointCost(1);
    console.log("[LibPriceTest] initPointCost", initPointCost);
    assertEq(
      LibPrice.getPointCost(1, 1 * pointUnit),
      config.startPointCost,
      "Starting Red Empire point cost incorrect"
    );
    initPointCost = Empire.getPointCost(2);
    console.log("[LibPriceTest] initPointCost", initPointCost);
    assertEq(
      LibPrice.getPointCost(2, 1 * pointUnit),
      config.startPointCost,
      "Starting Blue Empire point cost incorrect"
    );
    initPointCost = Empire.getPointCost(3);
    console.log("[LibPriceTest] initPointCost", initPointCost);
    assertEq(
      LibPrice.getPointCost(3, 1 * pointUnit),
      config.startPointCost,
      "Starting Green Empire point cost incorrect"
    );
  }

  function testGetTwoPointsCost() public {
    assertEq(
      LibPrice.getPointCost(1, 2 * pointUnit),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Red Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(2, 2 * pointUnit),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Blue Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(3, 2 * pointUnit),
      config.startPointCost + (config.pointCostIncrease + config.startPointCost),
      "Green Empire point cost for 2 points incorrect"
    );
  }

  function testGetRegressPointCostSingle() public {
    uint256 initPointCost = config.startPointCost;
    uint256 points = initPointCost * (EMPIRE_COUNT - 1);
    assertEq(LibPrice.getRegressPointCost(1, 1), points, "Red Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(2, 1), points, "Blue Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(3, 1), points, "Green Empire point cost for 2 points incorrect");
  }

  function testGetRegressPointCostMultiple() public {
    assertEq(
      LibPrice.getRegressPointCost(1, 2),
      LibPrice.getPointCost(1, 2 * pointUnit) * (EMPIRE_COUNT - 1),
      "Red Empire point cost for 2 bulk overrides incorrect"
    );
  }

  function testGetProgressPointCostSingle() public {
    uint256 initPointCost = config.startPointCost;
    assertEq(
      LibPrice.getProgressPointCost(1, 1),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Red Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(2, 1),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Blue Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(3, 1),
      (EMPIRE_COUNT - 1) * (initPointCost + ((EMPIRE_COUNT - 2) * config.pointCostIncrease) / 2),
      "Green Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
  }

  function testGetProgressPointCostMultiple() public {
    uint256 initPointCost = config.startPointCost;
    assertEq(
      LibPrice.getProgressPointCost(1, 2),
      2 * (EMPIRE_COUNT - 1) * (initPointCost + ((2 * EMPIRE_COUNT - 3) * config.pointCostIncrease) / 2),
      "Red Empire point cost for 2 bulk overrides incorrect"
    );
  }

  function testGetTotalCostProgressSingle() public {
    assertEq(
      LibPrice.getTotalCost(EOverride.CreateShip, 1, 1),
      createShipConfig.startOverrideCost + LibPrice.getProgressPointCost(1, 1),
      "Total cost for single override Red Empire incorrect"
    );
  }

  function testGetTotalCostProgressMultiple() public {
    assertEq(
      LibPrice.getTotalCost(EOverride.CreateShip, 1, 2),
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 1, 2) + LibPrice.getProgressPointCost(1, 2),
      "Total cost for multiple overrides Red Empire incorrect"
    );
  }

  function testGetTotalCostRegressSingle() public {
    assertEq(
      LibPrice.getTotalCost(EOverride.KillShip, 1, 1),
      LibPrice.getMarginalOverrideCost(EOverride.KillShip, 1, 1) + LibPrice.getRegressPointCost(1, 1),
      "Total cost for single override Red Empire incorrect"
    );
  }

  function testGetTotalCostRegressMultiple() public {
    assertEq(
      LibPrice.getTotalCost(EOverride.KillShip, 1, 2),
      LibPrice.getMarginalOverrideCost(EOverride.KillShip, 1, 2) + LibPrice.getRegressPointCost(1, 2),
      "Total cost for multiple overrides Red Empire incorrect"
    );
  }

  function testPointCostUp() public {
    vm.startPrank(creator);
    uint256 beginPointCost = LibPrice.getPointCost(1, 1 * pointUnit);
    LibPrice.pointCostUp(1, 1 * pointUnit);
    uint256 nextPointCost = LibPrice.getPointCost(1, 1 * pointUnit);
    assertEq(nextPointCost, beginPointCost + config.pointCostIncrease, "First point cost increase incorrect");
    LibPrice.pointCostUp(1, 1 * pointUnit);
    uint256 finalPointCost = LibPrice.getPointCost(1, 1 * pointUnit);
    assertEq(finalPointCost, nextPointCost + config.pointCostIncrease, "Second point cost increase incorrect");
    assertEq(
      LibPrice.getPointCost(2, 1 * pointUnit),
      config.startPointCost,
      "Blue Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(3, 1 * pointUnit),
      config.startPointCost,
      "Green Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(1, 2 * pointUnit),
      finalPointCost * 2 + config.pointCostIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testOverrideCostUp() public {
    vm.startPrank(creator);
    uint256 beginOverrideCost = OverrideCost.get(1, EOverride.CreateShip);
    LibPrice.overrideCostUp(1, EOverride.CreateShip, 1);
    uint256 nextOverrideCost = OverrideCost.get(1, EOverride.CreateShip);
    assertEq(
      nextOverrideCost,
      beginOverrideCost + createShipConfig.overrideCostIncrease,
      "First override cost increase incorrect"
    );
    LibPrice.overrideCostUp(1, EOverride.CreateShip, 1);
    uint256 finalOverrideCost = OverrideCost.get(1, EOverride.CreateShip);
    assertEq(
      finalOverrideCost,
      nextOverrideCost + createShipConfig.overrideCostIncrease,
      "Second override cost increase incorrect"
    );
    assertEq(
      OverrideCost.get(1, EOverride.KillShip),
      killShipConfig.startOverrideCost,
      "Red Empire's other override costs should not change"
    );
    assertEq(
      OverrideCost.get(2, EOverride.CreateShip),
      createShipConfig.startOverrideCost,
      "Blue Empire's override costs should not change"
    );
    assertEq(
      OverrideCost.get(3, EOverride.CreateShip),
      createShipConfig.startOverrideCost,
      "Green Empire's override costs should not change"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, 1, 2),
      finalOverrideCost * 2 + createShipConfig.overrideCostIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testEmpirePointCostDown() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost + config.pointGenRate);
    Empire.setPointCost(2, config.minPointCost + config.pointGenRate);
    Empire.setPointCost(3, config.minPointCost + config.pointGenRate);
    LibPrice.turnEmpirePointCostDown(1);
    assertEq(
      Empire.getPointCost(1),
      config.minPointCost,
      "Red Empire point cost down incorrect when matching gen rate"
    );
    assertEq(
      Empire.getPointCost(2),
      config.minPointCost + config.pointGenRate,
      "Blue Empire point cost should not change"
    );
    assertEq(
      Empire.getPointCost(3),
      config.minPointCost + config.pointGenRate,
      "Green Empire point cost should not change"
    );

    Empire.setPointCost(1, config.minPointCost + config.pointGenRate - 1);
    LibPrice.turnEmpirePointCostDown(1);
    assertEq(
      Empire.getPointCost(1),
      config.minPointCost,
      "Red Empire point cost down incorrect when less than gen rate"
    );

    Empire.setPointCost(1, config.minPointCost);
    LibPrice.turnEmpirePointCostDown(1);
    assertEq(Empire.getPointCost(1), config.minPointCost, "Red Empire point cost down incorrect when at min cost");

    Empire.setPointCost(1, config.minPointCost + config.pointGenRate + 1);
    LibPrice.turnEmpirePointCostDown(1);
    assertEq(
      Empire.getPointCost(1),
      config.minPointCost + 1,
      "Red Empire point cost down incorrect when greater than gen rate"
    );

    Empire.setPointCost(1, config.minPointCost + config.pointGenRate * 2 + 1);
    LibPrice.turnEmpirePointCostDown(1);
    assertEq(
      Empire.getPointCost(1),
      config.minPointCost + config.pointGenRate + 1,
      "Red Empire point cost down incorrect when much greater than gen rate"
    );
    LibPrice.turnEmpirePointCostDown(1);
    assertEq(Empire.getPointCost(1), config.minPointCost + 1, "Sequential Point cost down not working");

    assertEq(
      Empire.getPointCost(2),
      config.minPointCost + config.pointGenRate,
      "Blue Empire point cost should remain unchanged"
    );
    assertEq(
      Empire.getPointCost(3),
      config.minPointCost + config.pointGenRate,
      "Green Empire point cost should remain unchanged"
    );

    LibPrice.turnEmpirePointCostDown(3);
    assertEq(Empire.getPointCost(3), config.minPointCost, "Empire point cost down incorrect when different empire");
    assertEq(Empire.getPointCost(1), config.minPointCost + 1, "Red Empire point cost should remain unchanged");
  }

  function testEmpireOverridesCostDown() public {
    vm.startPrank(creator);
    OverrideCost.set(1, EOverride.CreateShip, createShipConfig.minOverrideCost + createShipConfig.overrideGenRate);
    OverrideCost.set(1, EOverride.KillShip, killShipConfig.minOverrideCost + killShipConfig.overrideGenRate);
    OverrideCost.set(2, EOverride.CreateShip, createShipConfig.minOverrideCost + createShipConfig.overrideGenRate);
    OverrideCost.set(2, EOverride.KillShip, killShipConfig.minOverrideCost + killShipConfig.overrideGenRate);
    OverrideCost.set(3, EOverride.CreateShip, createShipConfig.minOverrideCost + createShipConfig.overrideGenRate);
    OverrideCost.set(3, EOverride.KillShip, killShipConfig.minOverrideCost + killShipConfig.overrideGenRate);

    LibPrice.empireOverridesCostDown(1);
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Red Empire override cost down incorrect when matching gen rate"
    );
    assertEq(
      OverrideCost.get(1, EOverride.KillShip),
      killShipConfig.minOverrideCost,
      "Red Empire override cost down should affect all overrides of the empire"
    );
    assertEq(
      OverrideCost.get(2, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Blue Empire override cost should not change"
    );
    assertEq(
      OverrideCost.get(2, EOverride.KillShip),
      killShipConfig.minOverrideCost + killShipConfig.overrideGenRate,
      "Blue Empire override cost should not change"
    );
    assertEq(
      OverrideCost.get(3, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Green Empire override cost should not change"
    );
    assertEq(
      OverrideCost.get(3, EOverride.KillShip),
      killShipConfig.minOverrideCost + killShipConfig.overrideGenRate,
      "Green Empire override cost should not change"
    );

    OverrideCost.set(1, EOverride.CreateShip, createShipConfig.minOverrideCost + createShipConfig.overrideGenRate - 1);
    LibPrice.empireOverridesCostDown(1);
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Red Empire override cost down incorrect when less than gen rate"
    );

    OverrideCost.set(1, EOverride.CreateShip, createShipConfig.minOverrideCost);
    LibPrice.empireOverridesCostDown(1);
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Red Empire override cost down incorrect when at min cost"
    );

    OverrideCost.set(1, EOverride.CreateShip, createShipConfig.minOverrideCost + createShipConfig.overrideGenRate + 1);
    LibPrice.empireOverridesCostDown(1);
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost + 1,
      "Red Empire override cost down incorrect when greater than gen rate"
    );

    OverrideCost.set(
      1,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate * 2 + 1
    );
    LibPrice.empireOverridesCostDown(1);
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate + 1,
      "Red Empire override cost down incorrect when much greater than gen rate"
    );
    LibPrice.empireOverridesCostDown(1);
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost + 1,
      "Sequential Override cost down not working"
    );

    assertEq(
      OverrideCost.get(2, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Blue Empire override cost should remain unchanged"
    );
    assertEq(
      OverrideCost.get(3, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Green Empire override cost should remain unchanged"
    );

    LibPrice.empireOverridesCostDown(3);
    assertEq(
      OverrideCost.get(3, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Empire override cost down incorrect when different empire"
    );
    assertEq(
      OverrideCost.get(1, EOverride.CreateShip),
      createShipConfig.minOverrideCost + 1,
      "Red Empire override cost should remain unchanged"
    );
  }

  function testFailGetPointSaleValueMinPrice() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost);
    vm.expectRevert();
    LibPrice.getPointSaleValue(1, 1);
  }

  function testFailGetPointSaleValueOversoldSingle() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost + config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.getPointSaleValue(1, 1);
  }

  function testFailGetPointSaleValueOversoldMultiple() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost + 2 * config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.getPointSaleValue(1, 2);
  }

  function testGetPointSaleValueNoTax() public {
    vm.startPrank(creator);
    config.pointSellTax = 0;
    P_PointConfig.set(config);
    Empire.setPointCost(1, config.minPointCost + config.pointCostIncrease);
    Empire.setPointCost(2, config.minPointCost + config.pointCostIncrease + 1);
    Empire.setPointCost(3, config.minPointCost + config.pointCostIncrease * 2);

    assertEq(
      LibPrice.getPointSaleValue(1, 1 * pointUnit),
      config.minPointCost,
      "Red Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(2, 1 * pointUnit),
      config.minPointCost + 1,
      "Blue Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(3, 1 * pointUnit),
      config.minPointCost + config.pointCostIncrease,
      "Green Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(3, 2 * pointUnit),
      config.minPointCost * 2 + config.pointCostIncrease,
      "Green Empire multiple point sale value incorrect"
    );
  }

  function testGetPointSaleValueWithTax() public {
    vm.startPrank(creator);
    config.pointSellTax = 1;
    uint256 sellTax = config.pointSellTax;
    P_PointConfig.set(config);
    Empire.setPointCost(1, config.minPointCost + config.pointCostIncrease);
    Empire.setPointCost(2, config.minPointCost + config.pointCostIncrease + 1);
    Empire.setPointCost(3, config.minPointCost + config.pointCostIncrease * 2);

    assertEq(
      LibPrice.getPointSaleValue(1, 1 * pointUnit),
      config.minPointCost - sellTax,
      "Red Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(2, 1 * pointUnit),
      config.minPointCost - sellTax + 1,
      "Blue Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(3, 1 * pointUnit),
      config.minPointCost - sellTax + config.pointCostIncrease,
      "Green Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(3, 2 * pointUnit),
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
    Empire.setPointCost(1, config.minPointCost);
    vm.expectRevert();
    LibPrice.sellEmpirePointCostDown(1, 1);
  }

  function testFailSellEmpirePointCostDownOversoldSingle() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost + config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.sellEmpirePointCostDown(1, 1);
  }

  function testFailSellEmpirePointCostDownOversoldMultiple() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost + 2 * config.pointCostIncrease - 1);
    vm.expectRevert();
    LibPrice.sellEmpirePointCostDown(1, 2);
  }

  function testSellEmpirePointCostDownSingle() public {
    vm.startPrank(creator);
    Empire.setPointCost(1, config.minPointCost + config.pointCostIncrease);
    Empire.setPointCost(2, config.minPointCost + config.pointCostIncrease + 1);
    Empire.setPointCost(3, config.minPointCost + config.pointCostIncrease * 2);

    LibPrice.sellEmpirePointCostDown(1, 1 * pointUnit);
    LibPrice.sellEmpirePointCostDown(2, 1 * pointUnit);
    LibPrice.sellEmpirePointCostDown(3, 1 * pointUnit);

    assertEq(Empire.getPointCost(1), config.minPointCost, "Red Empire point cost after sale incorrect");
    assertEq(Empire.getPointCost(2), config.minPointCost + 1, "Blue Empire point cost after sale incorrect");
    assertEq(
      Empire.getPointCost(3),
      config.minPointCost + config.pointCostIncrease,
      "Green Empire point cost after sale incorrect"
    );
  }

  function testSellEmpirePointCostDownMultiple() public {
    vm.startPrank(creator);
    Empire.setPointCost(3, config.minPointCost + config.pointCostIncrease * 2);
    LibPrice.sellEmpirePointCostDown(3, 2 * pointUnit);
    assertEq(
      Empire.getPointCost(3),
      config.minPointCost,
      "Green Empire point cost after multiple points sold incorrect"
    );
  }
}
