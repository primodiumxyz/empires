// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console, PrimodiumTest } from "test/PrimodiumTest.t.sol";
import { addressToId } from "src/utils.sol";

import { P_GameConfig, Empire, OverrideCost, P_PointConfig, P_PointConfigData, P_OverrideConfig, P_OverrideConfigData } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";

contract LibPriceTest is PrimodiumTest {
  P_PointConfigData config;
  P_OverrideConfigData createShipConfig;
  uint256 pointUnit;
  uint8 EMPIRE_COUNT;
  function setUp() public override {
    super.setUp();
    config = P_PointConfig.get();
    pointUnit = config.pointUnit;
    createShipConfig = P_OverrideConfig.get(EOverride.CreateShip);
    EMPIRE_COUNT = P_GameConfig.getEmpireCount();

    vm.startPrank(creator);

    vm.stopPrank();
  }

  function testStartGetMarginalOverrideCost() public {
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Red, 1),
      createShipConfig.startOverrideCost,
      "Starting Red Empire marginal override cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Blue, 1),
      createShipConfig.startOverrideCost,
      "Starting Blue Empire marginal override cost incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Green, 1),
      createShipConfig.startOverrideCost,
      "Starting Green Empire marginal override cost incorrect"
    );
  }

  function testGetTwoMarginalOverrideCost() public {
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Red, 2),
      createShipConfig.startOverrideCost + (createShipConfig.startOverrideCost + createShipConfig.overrideCostIncrease),
      "Red Empire marginal override cost for 2 overrides incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Blue, 2),
      createShipConfig.startOverrideCost + (createShipConfig.startOverrideCost + createShipConfig.overrideCostIncrease),
      "Blue Empire marginal override cost for 2 overrides incorrect"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Green, 2),
      createShipConfig.startOverrideCost + (createShipConfig.startOverrideCost + createShipConfig.overrideCostIncrease),
      "Green Empire marginal override cost for 2 overrides incorrect"
    );
  }

  function testStartGetPointCost() public {
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit),
      config.startPointPrice,
      "Starting Red Empire point cost incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 1 * pointUnit),
      config.startPointPrice,
      "Starting Blue Empire point cost incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 1 * pointUnit),
      config.startPointPrice,
      "Starting Green Empire point cost incorrect"
    );
  }

  function testGetTwoPointsCost() public {
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 2 * pointUnit),
      config.startPointPrice + (config.pointPriceIncrease + config.startPointPrice),
      "Red Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 2 * pointUnit),
      config.startPointPrice + (config.pointPriceIncrease + config.startPointPrice),
      "Blue Empire point cost for 2 points incorrect"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 2 * pointUnit),
      config.startPointPrice + (config.pointPriceIncrease + config.startPointPrice),
      "Green Empire point cost for 2 points incorrect"
    );
  }

  function testGetPointCostDefeatedEmpire() public {
    vm.startPrank(creator);
    Empire.setIsDefeated(EEmpire.Red, true);
    assertEq(LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit), 0, "Red Empire point cost for 1 point should be 0");
    assertEq(LibPrice.getPointCost(EEmpire.Red, 1000 * pointUnit), 0, "Red Empire point cost for 1000 points should be 0");
    assertEq(LibPrice.getPointCost(EEmpire.Blue, 1 * pointUnit), config.startPointPrice, "Blue Empire point cost for 1 point should not be 0");
  }

  function testGetRegressPointCostSingle() public {
    uint256 initPointPrice = config.startPointPrice;
    vm.startPrank(creator);
    P_OverrideConfig.setPointMultiplier(EOverride.DetonateShieldEater, 2);
    uint256 pointCost = (initPointPrice + (initPointPrice + config.pointPriceIncrease)) * (EMPIRE_COUNT - 1);
    assertEq(LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Red, 1), pointCost, "Red Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Blue, 1), pointCost, "Blue Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Green, 1), pointCost, "Green Empire point cost for 2 points incorrect");
  }

  function testGetRegressPointCostMultiple() public {
    assertEq(
      LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Red, 2),
      LibPrice.getPointCost(EEmpire.Red, 2 * pointUnit * P_OverrideConfig.getPointMultiplier(EOverride.DetonateShieldEater)) * (EMPIRE_COUNT - 1),
      "Red Empire point cost for 2 bulk overrides incorrect"
    );
  }

  function testGetRegressPointCostDefeatedEmpire() public {
    vm.startPrank(creator);
    Empire.setIsDefeated(EEmpire.Red, true);
    uint256 initPointPrice = config.startPointPrice;
    P_OverrideConfig.setPointMultiplier(EOverride.DetonateShieldEater, 2);
    uint256 pointCost = (initPointPrice + (initPointPrice + config.pointPriceIncrease)) * (EMPIRE_COUNT - 2); // Empire count minus 2 because Red is defeated and the impacted empire should not be included
    uint256 deadRegressPointCost = (initPointPrice + (initPointPrice + config.pointPriceIncrease)) * (EMPIRE_COUNT - 1); // this shouldn't happen in production but we'll test it just in case
    assertEq(LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Red, 1), deadRegressPointCost, "Red Empire point cost for 2 points incorrect"); // this shouldn't happen in production but we'll test it just in case
    assertEq(LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Blue, 1), pointCost, "Blue Empire point cost for 2 points incorrect");
    assertEq(LibPrice.getRegressPointCost(EOverride.DetonateShieldEater, EEmpire.Green, 1),pointCost, "Green Empire point cost for 2 points incorrect");
  }

  function testGetProgressPointCostSingle() public {
    uint256 initPointPrice = config.startPointPrice;
    assertEq(
      LibPrice.getProgressPointCost(EOverride.CreateShip, EEmpire.Red, 1),
      (EMPIRE_COUNT - 1) * (initPointPrice + ((EMPIRE_COUNT - 2) * config.pointPriceIncrease) / 2) * P_OverrideConfig.getPointMultiplier(EOverride.CreateShip),
      "Red Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(EOverride.CreateShip, EEmpire.Blue, 1),
      (EMPIRE_COUNT - 1) * (initPointPrice + ((EMPIRE_COUNT - 2) * config.pointPriceIncrease) / 2) * P_OverrideConfig.getPointMultiplier(EOverride.CreateShip),
      "Blue Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
    assertEq(
      LibPrice.getProgressPointCost(EOverride.CreateShip, EEmpire.Green, 1),
      (EMPIRE_COUNT - 1) * (initPointPrice + ((EMPIRE_COUNT - 2) * config.pointPriceIncrease) / 2) * P_OverrideConfig.getPointMultiplier(EOverride.CreateShip),
      "Green Empire point cost for EMPIRE_COUNT - 1 points incorrect"
    );
  }

  function testGetProgressPointCostMultiple() public {
    uint256 initPointPrice = config.startPointPrice;
    assertEq(
      LibPrice.getProgressPointCost(EOverride.CreateShip, EEmpire.Red, 2),
      2 * (EMPIRE_COUNT - 1) * (initPointPrice + ((2 * EMPIRE_COUNT - 3) * config.pointPriceIncrease) / 2) * P_OverrideConfig.getPointMultiplier(EOverride.CreateShip),
      "Red Empire point cost for 2 bulk overrides incorrect"
    );
  }

  function testGetTotalCostProgressSingle() public {
    assertEq(
      LibPrice.getTotalCost(EOverride.CreateShip, EEmpire.Red, 1),
      createShipConfig.startOverrideCost + LibPrice.getProgressPointCost(EOverride.CreateShip, EEmpire.Red, 1),
      "Total cost for single override Red Empire incorrect"
    );
  }

  function testGetTotalCostProgressMultiple() public {
    assertEq(
      LibPrice.getTotalCost(EOverride.CreateShip, EEmpire.Red, 2),
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Red, 2) +
        LibPrice.getProgressPointCost(EOverride.CreateShip, EEmpire.Red, 2),
      "Total cost for multiple overrides Red Empire incorrect"
    );
  }

  function testPointPriceUp() public {
    vm.startPrank(creator);
    uint256 beginPointCost = LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit);
    LibPrice.pointPriceUp(EEmpire.Red, 1 * pointUnit);
    uint256 nextPointCost = LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit);
    assertEq(nextPointCost, beginPointCost + config.pointPriceIncrease, "First point price increase incorrect");
    LibPrice.pointPriceUp(EEmpire.Red, 1 * pointUnit);
    uint256 finalPointCost = LibPrice.getPointCost(EEmpire.Red, 1 * pointUnit);
    assertEq(finalPointCost, nextPointCost + config.pointPriceIncrease, "Second point price increase incorrect");
    assertEq(
      LibPrice.getPointCost(EEmpire.Blue, 1 * pointUnit),
      config.startPointPrice,
      "Blue Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Green, 1 * pointUnit),
      config.startPointPrice,
      "Green Empire point cost should not change"
    );
    assertEq(
      LibPrice.getPointCost(EEmpire.Red, 2 * pointUnit),
      finalPointCost * 2 + config.pointPriceIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testOverrideCostUp() public {
    vm.startPrank(creator);
    uint256 beginOverrideCost = OverrideCost.get(EEmpire.Red, EOverride.CreateShip);
    LibPrice.overrideCostUp(EEmpire.Red, EOverride.CreateShip, 1);
    uint256 nextOverrideCost = OverrideCost.get(EEmpire.Red, EOverride.CreateShip);
    assertEq(
      nextOverrideCost,
      beginOverrideCost + createShipConfig.overrideCostIncrease,
      "First override cost increase incorrect"
    );
    LibPrice.overrideCostUp(EEmpire.Red, EOverride.CreateShip, 1);
    uint256 finalOverrideCost = OverrideCost.get(EEmpire.Red, EOverride.CreateShip);
    assertEq(
      finalOverrideCost,
      nextOverrideCost + createShipConfig.overrideCostIncrease,
      "Second override cost increase incorrect"
    );

    assertEq(
      OverrideCost.get(EEmpire.Blue, EOverride.CreateShip),
      createShipConfig.startOverrideCost,
      "Blue Empire's override costs should not change"
    );
    assertEq(
      OverrideCost.get(EEmpire.Green, EOverride.CreateShip),
      createShipConfig.startOverrideCost,
      "Green Empire's override costs should not change"
    );
    assertEq(
      LibPrice.getMarginalOverrideCost(EOverride.CreateShip, EEmpire.Red, 2),
      finalOverrideCost * 2 + createShipConfig.overrideCostIncrease,
      "Red Empire point cost for 2 points incorrect"
    );
  }

  function testEmpirePointPriceDown() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointGenRate);
    Empire.setPointPrice(EEmpire.Blue, config.minPointPrice + config.pointGenRate);
    Empire.setPointPrice(EEmpire.Green, config.minPointPrice + config.pointGenRate);
    LibPrice.turnEmpirePointPriceDown(EEmpire.Red);
    assertEq(
      Empire.getPointPrice(EEmpire.Red),
      config.minPointPrice,
      "Red Empire point price down incorrect when matching gen rate"
    );
    assertEq(
      Empire.getPointPrice(EEmpire.Blue),
      config.minPointPrice + config.pointGenRate,
      "Blue Empire point price should not change"
    );
    assertEq(
      Empire.getPointPrice(EEmpire.Green),
      config.minPointPrice + config.pointGenRate,
      "Green Empire point price should not change"
    );

    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointGenRate - 1);
    LibPrice.turnEmpirePointPriceDown(EEmpire.Red);
    assertEq(
      Empire.getPointPrice(EEmpire.Red),
      config.minPointPrice,
      "Red Empire point price down incorrect when less than gen rate"
    );

    Empire.setPointPrice(EEmpire.Red, config.minPointPrice);
    LibPrice.turnEmpirePointPriceDown(EEmpire.Red);
    assertEq(
      Empire.getPointPrice(EEmpire.Red),
      config.minPointPrice,
      "Red Empire point price down incorrect when at min price"
    );

    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointGenRate + 1);
    LibPrice.turnEmpirePointPriceDown(EEmpire.Red);
    assertEq(
      Empire.getPointPrice(EEmpire.Red),
      config.minPointPrice + 1,
      "Red Empire point price down incorrect when greater than gen rate"
    );

    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointGenRate * 2 + 1);
    LibPrice.turnEmpirePointPriceDown(EEmpire.Red);
    assertEq(
      Empire.getPointPrice(EEmpire.Red),
      config.minPointPrice + config.pointGenRate + 1,
      "Red Empire point price down incorrect when much greater than gen rate"
    );
    LibPrice.turnEmpirePointPriceDown(EEmpire.Red);
    assertEq(Empire.getPointPrice(EEmpire.Red), config.minPointPrice + 1, "Sequential Point price down not working");

    assertEq(
      Empire.getPointPrice(EEmpire.Blue),
      config.minPointPrice + config.pointGenRate,
      "Blue Empire point price should remain unchanged"
    );
    assertEq(
      Empire.getPointPrice(EEmpire.Green),
      config.minPointPrice + config.pointGenRate,
      "Green Empire point price should remain unchanged"
    );

    LibPrice.turnEmpirePointPriceDown(EEmpire.Green);
    assertEq(
      Empire.getPointPrice(EEmpire.Green),
      config.minPointPrice,
      "Empire point price down incorrect when different empire"
    );
    assertEq(
      Empire.getPointPrice(EEmpire.Red),
      config.minPointPrice + 1,
      "Red Empire point price should remain unchanged"
    );
  }

  function testEmpireOverridesCostDown() public {
    vm.startPrank(creator);
    OverrideCost.set(
      EEmpire.Red,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate
    );
    OverrideCost.set(
      EEmpire.Blue,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate
    );
    OverrideCost.set(
      EEmpire.Green,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate
    );

    LibPrice.empireOverridesCostDown(EEmpire.Red);
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Red Empire override cost down incorrect when matching gen rate"
    );

    assertEq(
      OverrideCost.get(EEmpire.Blue, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Blue Empire override cost should not change"
    );

    assertEq(
      OverrideCost.get(EEmpire.Green, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Green Empire override cost should not change"
    );

    OverrideCost.set(
      EEmpire.Red,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate - 1
    );
    LibPrice.empireOverridesCostDown(EEmpire.Red);
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Red Empire override cost down incorrect when less than gen rate"
    );

    OverrideCost.set(EEmpire.Red, EOverride.CreateShip, createShipConfig.minOverrideCost);
    LibPrice.empireOverridesCostDown(EEmpire.Red);
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Red Empire override cost down incorrect when at min cost"
    );

    OverrideCost.set(
      EEmpire.Red,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate + 1
    );
    LibPrice.empireOverridesCostDown(EEmpire.Red);
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost + 1,
      "Red Empire override cost down incorrect when greater than gen rate"
    );

    OverrideCost.set(
      EEmpire.Red,
      EOverride.CreateShip,
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate * 2 + 1
    );
    LibPrice.empireOverridesCostDown(EEmpire.Red);
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate + 1,
      "Red Empire override cost down incorrect when much greater than gen rate"
    );
    LibPrice.empireOverridesCostDown(EEmpire.Red);
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost + 1,
      "Sequential Override cost down not working"
    );

    assertEq(
      OverrideCost.get(EEmpire.Blue, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Blue Empire override cost should remain unchanged"
    );
    assertEq(
      OverrideCost.get(EEmpire.Green, EOverride.CreateShip),
      createShipConfig.minOverrideCost + createShipConfig.overrideGenRate,
      "Green Empire override cost should remain unchanged"
    );

    LibPrice.empireOverridesCostDown(EEmpire.Green);
    assertEq(
      OverrideCost.get(EEmpire.Green, EOverride.CreateShip),
      createShipConfig.minOverrideCost,
      "Empire override cost down incorrect when different empire"
    );
    assertEq(
      OverrideCost.get(EEmpire.Red, EOverride.CreateShip),
      createShipConfig.minOverrideCost + 1,
      "Red Empire override cost should remain unchanged"
    );
  }

  function testFailGetPointSaleValueMinPrice() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice);
    vm.expectRevert();
    LibPrice.getPointSaleValue(EEmpire.Red, 1);
  }

  function testFailGetPointSaleValueOversoldSingle() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointPriceIncrease - 1);
    vm.expectRevert();
    LibPrice.getPointSaleValue(EEmpire.Red, 1);
  }

  function testFailGetPointSaleValueOversoldMultiple() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + 2 * config.pointPriceIncrease - 1);
    vm.expectRevert();
    LibPrice.getPointSaleValue(EEmpire.Red, 2);
  }

  function testGetPointSaleValueNoTax() public {
    vm.startPrank(creator);
    config.pointSellTax = 0;
    P_PointConfig.set(config);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointPriceIncrease);
    Empire.setPointPrice(EEmpire.Blue, config.minPointPrice + config.pointPriceIncrease + 1);
    Empire.setPointPrice(EEmpire.Green, config.minPointPrice + config.pointPriceIncrease * 2);

    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Red, 1 * pointUnit),
      config.minPointPrice,
      "Red Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Blue, 1 * pointUnit),
      config.minPointPrice + 1,
      "Blue Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 1 * pointUnit),
      config.minPointPrice + config.pointPriceIncrease,
      "Green Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 2 * pointUnit),
      config.minPointPrice * 2 + config.pointPriceIncrease,
      "Green Empire multiple point sale value incorrect"
    );
  }

  function testGetPointSaleValueWithTax() public {
    vm.startPrank(creator);
    config.pointSellTax = 500; // 5%
    uint256 sellTax = config.pointSellTax;
    P_PointConfig.set(config);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointPriceIncrease);
    Empire.setPointPrice(EEmpire.Blue, config.minPointPrice + config.pointPriceIncrease + 1);
    Empire.setPointPrice(EEmpire.Green, config.minPointPrice + config.pointPriceIncrease * 2);

    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Red, 1 * pointUnit),
      config.minPointPrice - ((config.minPointPrice * sellTax) / 10000),
      "Red Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Blue, 1 * pointUnit),
      (config.minPointPrice + 1) * (10000 - sellTax) / 10000,
      "Blue Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 1 * pointUnit),
      (config.minPointPrice + config.pointPriceIncrease) * (10000 - sellTax) / 10000,
      "Green Empire point sale value incorrect"
    );
    assertEq(
      LibPrice.getPointSaleValue(EEmpire.Green, 2 * pointUnit),
      (config.minPointPrice * 2 + config.pointPriceIncrease) * (10000 - sellTax) / 10000,
      "Green Empire multiple point sale value incorrect"
    );
  }

  function testFailSellEmpirePointPriceDownMinPrice() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice);
    vm.expectRevert();
    LibPrice.sellEmpirePointPriceDown(EEmpire.Red, 1);
  }

  function testFailSellEmpirePointPriceDownOversoldSingle() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointPriceIncrease - 1);
    vm.expectRevert();
    LibPrice.sellEmpirePointPriceDown(EEmpire.Red, 1);
  }

  function testFailSellEmpirePointPriceDownOversoldMultiple() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + 2 * config.pointPriceIncrease - 1);
    vm.expectRevert();
    LibPrice.sellEmpirePointPriceDown(EEmpire.Red, 2);
  }

  function testSellEmpirePointPriceDownSingle() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Red, config.minPointPrice + config.pointPriceIncrease);
    Empire.setPointPrice(EEmpire.Blue, config.minPointPrice + config.pointPriceIncrease + 1);
    Empire.setPointPrice(EEmpire.Green, config.minPointPrice + config.pointPriceIncrease * 2);

    LibPrice.sellEmpirePointPriceDown(EEmpire.Red, 1 * pointUnit);
    LibPrice.sellEmpirePointPriceDown(EEmpire.Blue, 1 * pointUnit);
    LibPrice.sellEmpirePointPriceDown(EEmpire.Green, 1 * pointUnit);

    assertEq(Empire.getPointPrice(EEmpire.Red), config.minPointPrice, "Red Empire point price after sale incorrect");
    assertEq(Empire.getPointPrice(EEmpire.Blue), config.minPointPrice + 1, "Blue Empire point price after sale incorrect");
    assertEq(
      Empire.getPointPrice(EEmpire.Green),
      config.minPointPrice + config.pointPriceIncrease,
      "Green Empire point price after sale incorrect"
    );
  }

  function testSellEmpirePointPriceDownMultiple() public {
    vm.startPrank(creator);
    Empire.setPointPrice(EEmpire.Green, config.minPointPrice + config.pointPriceIncrease * 2);
    LibPrice.sellEmpirePointPriceDown(EEmpire.Green, 2 * pointUnit);
    assertEq(
      Empire.getPointPrice(EEmpire.Green),
      config.minPointPrice,
      "Green Empire point price after multiple points sold incorrect"
    );
  }
}
