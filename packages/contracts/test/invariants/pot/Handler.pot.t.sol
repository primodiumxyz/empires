// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { HandlerBase } from "test/invariants/Handler.Base.t.sol";

import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { Empire, Magnet, Planet, PlanetData, P_MagnetConfig, P_PointConfig, P_ShieldEaterConfig, ShieldEater, Turn, WinningEmpire } from "codegen/index.sol";
import { EEmpire, EOverride } from "codegen/common.sol";
import { LibPrice } from "libraries/LibPrice.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { ADMIN_NAMESPACE_ID, EMPIRES_NAMESPACE_ID } from "src/constants.sol";
import { addressToId } from "src/utils.sol";

contract HandlerPot is HandlerBase {
  error HandlerPot__SaleDecreaseUnderflow();

  /* -------------------------------------------------------------------------- */
  /*                                   STORAGE                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Points unit
  uint256 private immutable POINTS_UNIT;

  /// @dev The expected pot (mirrored from each override purchase or sale)
  uint256 private _mirrorPot;
  /// @dev The rake taken from each override
  uint256 private _mirrorRake;

  /// @dev Tracking variables for logs
  uint256 private _log_sellPointsCount;
  uint256 private _log_withdrawEarningsCount;

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  constructor(address _world, address _creator) HandlerBase(_world, _creator) {
    POINTS_UNIT = P_PointConfig.getPointUnit();
  }

  /* ---------------------------- PURCHASE ACTIONS ---------------------------- */

  /// @dev Airdrop gold to a random empire for points
  /// Note: see `OverrideAirdropSystem`
  /// - This function should increase the pot by the cost of the override purchase
  function airdropGold(uint256 playerSeed, uint256 empireSeed, uint256 overrideCountSeed) public payable {
    // Will skip if the game is over and we're not allowing unexpected inputs
    if (shouldSkip(block.number >= GAME_OVER_BLOCK)) return;

    // Prepare "random" but credible inputs
    address player = _selectRandomOrCreatePlayer(playerSeed);
    EEmpire empire = _selectRandomOwnedEmpire(empireSeed);
    (uint256 overrideCount, uint256 overrideCost) = _getSensibleOverrideCount(
      overrideCountSeed,
      EOverride.AirdropGold,
      empire,
      player
    );

    // Purchase override
    vm.prank(player);
    world.Empires__airdropGold{ value: overrideCost }(empire, overrideCount);

    // Mirror (expected) pot and rake
    _afterPurchaseIncrease(overrideCost);
  }

  /// @dev Create ships on a planet
  /// Note: see `OverrideShipSystem`
  /// - This function should increase the pot by the cost of the override purchase
  function createShip(uint256 playerSeed, uint256 planetSeed, uint256 overrideCountSeed) public payable {
    if (shouldSkip(block.number >= GAME_OVER_BLOCK)) return;
    address player = _selectRandomOrCreatePlayer(playerSeed);
    (bytes32 planet, EEmpire empire) = _selectRandomOwnedPlanet(planetSeed);
    (uint256 overrideCount, uint256 overrideCost) = _getSensibleOverrideCount(
      overrideCountSeed,
      EOverride.CreateShip,
      empire,
      player
    );

    vm.prank(player);
    world.Empires__createShip{ value: overrideCost }(planet, empire, overrideCount);

    _afterPurchaseIncrease(overrideCost);
  }

  /// @dev Place shields on a planet
  /// Note: see `OverrideShieldSystem`
  /// - This function should increase the pot by the cost of the override purchase
  function chargeShield(uint256 playerSeed, uint256 planetSeed, uint256 overrideCountSeed) public payable {
    if (shouldSkip(block.number >= GAME_OVER_BLOCK)) return;
    address player = _selectRandomOrCreatePlayer(playerSeed);
    (bytes32 planet, EEmpire empire) = _selectRandomOwnedPlanet(planetSeed);
    (uint256 overrideCount, uint256 overrideCost) = _getSensibleOverrideCount(
      overrideCountSeed,
      EOverride.ChargeShield,
      empire,
      player
    );

    vm.prank(player);
    world.Empires__chargeShield{ value: overrideCost }(planet, empire, overrideCount);

    _afterPurchaseIncrease(overrideCost);
  }

  /// @dev Place acid rain on a planet
  /// Note: see `OverrideAcidSystem`, `LibAcid`
  /// - This function should increase the pot by the cost of the override purchase
  function placeAcid(uint256 playerSeed, uint256 planetSeed) public payable {
    if (shouldSkip(block.number >= GAME_OVER_BLOCK)) return;
    address player = _selectRandomOrCreatePlayer(playerSeed);
    (bytes32 planet, EEmpire empire) = _selectRandomOwnedPlanet(planetSeed);
    uint256 overrideCost = LibPrice.getTotalCost(EOverride.PlaceAcid, empire, 1);
    vm.deal(player, overrideCost);

    // don't attempt to place acid on a planet that already has it
    // assume would enter an endless loop pretty quickly
    if (AcidPlanetsSet.getAcidCycles(empire, planet) != 0) return;

    vm.prank(player);
    world.Empires__placeAcid{ value: overrideCost }(planet, empire);

    _afterPurchaseIncrease(overrideCost);
  }

  /// @dev Place magnet on a planet
  /// Note: see `OverrideMagnetSystem`, `LibMagnet`
  /// - This function should increase the pot by the cost of the override purchase
  function placeMagnet(uint256 playerSeed, uint256 planetSeed, uint256 overrideCountSeed) public payable {
    if (shouldSkip(block.number >= GAME_OVER_BLOCK)) return;
    address player = _selectRandomOrCreatePlayer(playerSeed);
    (bytes32 planet, EEmpire empire) = _selectRandomOwnedPlanet(planetSeed);
    (uint256 overrideCount, uint256 overrideCost) = _getSensibleOverrideCount(
      overrideCountSeed,
      EOverride.PlaceMagnet,
      empire,
      player
    );

    // don't attempt to place a magnet on a planet that already has one for the same empire
    if (Magnet.get(empire, planet).isMagnet) return;
    // don't attempt to place a magnet if the player doesn't have enough points to lock
    uint256 requiredPoints = (P_MagnetConfig.getLockedPointsPercent() * Empire.getPointsIssued(empire)) / 10000;
    bytes32 playerId = addressToId(player);
    if (requiredPoints > PointsMap.getValue(empire, playerId) - PointsMap.getLockedPoints(empire, playerId)) return;

    vm.prank(player);
    world.Empires__placeMagnet{ value: overrideCost }(empire, planet, overrideCount);

    _afterPurchaseIncrease(overrideCost);
  }

  /// @dev Detonate the shield eater
  /// Note: see `OverrideShieldEaterSystem`, `LibShieldEater`
  /// - This function should increase the pot by the cost of the override purchase
  function detonateShieldEater(uint256 playerSeed) public payable {
    if (shouldSkip(block.number >= GAME_OVER_BLOCK)) return;
    address player = _selectRandomOrCreatePlayer(playerSeed);
    PlanetData memory planetData = Planet.get(ShieldEater.getCurrentPlanet());
    EEmpire empire = planetData.empireId;
    uint256 overrideCost = LibPrice.getTotalCost(EOverride.DetonateShieldEater, empire, 1);
    vm.deal(player, overrideCost);

    // don't attempt to detonate a shield eater if it's not fully charged
    if (ShieldEater.getCurrentCharge() < P_ShieldEaterConfig.getDetonationThreshold()) return;

    vm.prank(player);
    world.Empires__detonateShieldEater{ value: overrideCost }();

    _afterPurchaseIncrease(overrideCost);
  }

  /* ------------------------------ SELL ACTIONS ------------------------------ */

  /// @dev Sell points from an empire for native tokens
  /// Note: see `OverridePointsSystem`, `LibPoint`, `LibPrice`
  /// - This function should decrease the pot by the price of the points sold
  function sellPoints(uint256 playerSeed, uint256 empireSeed, uint256 pointsSeed) public payable {
    address player = _selectRandomOrCreatePlayer(playerSeed);
    bytes32 playerId = addressToId(player);
    EEmpire empire = _selectRandomEmpire(empireSeed);
    uint256 playerPoints = PointsMap.getValue(empire, playerId);
    uint256 playerLockedPoints = PointsMap.getLockedPoints(empire, playerId);

    uint256 pointsIssuedByEmpire = Empire.getPointsIssued(empire);
    uint256 potBalanceBefore = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 rakeBalanceBefore = Balances.get(ADMIN_NAMESPACE_ID);
    uint256 playerBalanceBefore = player.balance;

    // we don't want to restrict inputs too much, but instead allow unexpected inputs (try with up to twice the available points)
    uint256 pointsToSell = POINTS_UNIT * _hem(pointsSeed, 0, ((playerPoints - playerLockedPoints) / POINTS_UNIT) * 2);
    // TODO: substract sell tax
    uint256 expectedPointSaleValue = pointsToSell > 0 ? LibPrice.getPointSaleValue(empire, pointsToSell) : 0;

    // requirements for the sale to be (supposed to be) successful:
    // - points to sell is greater than 0
    bool requirementsFulfilled = pointsToSell > 0 &&
      // - player has enough points to sell
      playerPoints >= pointsToSell &&
      // - the pot has enough native tokens to send
      expectedPointSaleValue <= _mirrorPot &&
      // - the empire has issued enough points
      pointsIssuedByEmpire >= pointsToSell;

    // don't proceed if we don't allow unexpected inputs and the requirements are not met
    if (shouldSkip(!requirementsFulfilled)) return;
    vm.prank(player);
    bool success = _sellPoints(empire, pointsToSell);

    // expected outcomes:
    // - the pot was decreased by the expected amount of native tokens
    bool outcomesAchieved = Balances.get(EMPIRES_NAMESPACE_ID) == potBalanceBefore - expectedPointSaleValue &&
      // - the rake didn't decrease
      Balances.get(ADMIN_NAMESPACE_ID) == rakeBalanceBefore &&
      // - the player was sent the exact amount of native tokens
      player.balance == playerBalanceBefore + expectedPointSaleValue &&
      // - the points map was updated correctly
      PointsMap.getValue(empire, playerId) == playerPoints - pointsToSell;

    // an decrease in the pot implies that all requirements were met and that the outcomes should all be achieved
    assert_implies(
      Balances.get(EMPIRES_NAMESPACE_ID) < potBalanceBefore,
      success && requirementsFulfilled && outcomesAchieved
    );
    // decrease the mirrored pot only if the sale happened under expected circumstances
    if (success && requirementsFulfilled && outcomesAchieved) _afterSaleDecrease(expectedPointSaleValue);

    if (success) _log_sellPointsCount++;
  }

  /// @dev Call `Empires__sellPoints` and return the success status
  function _sellPoints(EEmpire _empire, uint256 _points) private returns (bool success) {
    (success, ) = address(world).call(
      abi.encodeWithSignature("Empires__sellPoints(uint8,uint256)", uint8(_empire), _points)
    );
  }

  /// @dev Withdraw earnings after the game ended
  /// Note: see `RewardsSystem`
  /// - This function should decrease the pot by the price of the points the player could withdraw
  function withdrawEarnings(uint256 playerSeed) public payable {
    if (shouldSkip(block.number >= GAME_OVER_BLOCK && WinningEmpire.get() != EEmpire.NULL)) return;
    address player = _selectRandomOrCreatePlayer(playerSeed);
    bytes32 playerId = addressToId(player);
    EEmpire winningEmpire = WinningEmpire.get();
    uint256 playerPoints = PointsMap.getValue(winningEmpire, playerId);
    uint256 playerLockedPoints = PointsMap.getLockedPoints(winningEmpire, playerId);

    uint256 pointsIssuedByEmpire = Empire.getPointsIssued(winningEmpire);
    uint256 potBalanceBefore = Balances.get(EMPIRES_NAMESPACE_ID);
    uint256 rakeBalanceBefore = Balances.get(ADMIN_NAMESPACE_ID);
    uint256 playerBalanceBefore = player.balance;

    uint256 playerPot = pointsIssuedByEmpire > 0
      ? (potBalanceBefore * (playerPoints - playerLockedPoints)) / pointsIssuedByEmpire
      : 0;

    // requirements for the withdrawal to be (supposed to be) successful:
    // - an empire has won the game
    bool requirementsFulfilled = winningEmpire != EEmpire.NULL &&
      // - the empire has issued enough points
      pointsIssuedByEmpire > 0;
    // - player has enough points for this empire
    playerPoints > 0 &&
      // - the pot has enough native tokens to send
      playerPot <= _mirrorPot;

    // don't proceed if we don't allow unexpected inputs and the requirements are not met
    if (shouldSkip(!requirementsFulfilled)) return;
    vm.prank(player);
    bool success = _withdrawEarnings();

    // expected outcomes:
    // - the pot was decreased by the expected amount of native tokens
    bool outcomesAchieved = Balances.get(EMPIRES_NAMESPACE_ID) == potBalanceBefore - playerPot &&
      // - the rake didn't decrease
      Balances.get(ADMIN_NAMESPACE_ID) == rakeBalanceBefore &&
      // - the player was sent the exact amount of native tokens
      player.balance == playerBalanceBefore + playerPot &&
      // - the points map was updated correctly
      PointsMap.getValue(winningEmpire, playerId) == 0;

    // a decrease in the pot implies that all requirements were met and that the outcomes should all be achieved
    assert_implies(
      Balances.get(EMPIRES_NAMESPACE_ID) < potBalanceBefore,
      success && requirementsFulfilled && outcomesAchieved
    );
    // decrease the mirrored pot only if the sale happened under expected circumstances
    if (success && requirementsFulfilled && outcomesAchieved) _afterSaleDecrease(playerPot);

    if (success) _log_withdrawEarningsCount++;
  }

  /// @dev Call `Empires__withdrawEarnings` and return the success status
  function _withdrawEarnings() private returns (bool success) {
    (success, ) = address(world).call(abi.encodeWithSignature("Empires__withdrawEarnings()"));
  }

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Increase the expected pot and rake
  function _afterPurchaseIncrease(uint256 cost) internal {
    uint256 rake = (cost * P_PointConfig.getPointRake()) / 10_000;
    _mirrorPot += cost - rake;
    _mirrorRake += rake;
  }

  /// @dev Decrease the expected pot after a sale
  function _afterSaleDecrease(uint256 value) internal {
    if (value > _mirrorPot) revert HandlerPot__SaleDecreaseUnderflow();
    _mirrorPot -= value;
  }

  /// @dev Log tracking variables (called in `Invariants.pot.t.sol::afterInvariant`)
  function logTrackers() external {
    if (!LOG_COVERAGE) return;
    emit log_string("---");
    emit log_named_uint("Last turn", Turn.getValue());
    emit log_named_string("Reached game over", block.number >= GAME_OVER_BLOCK ? "Yes" : "No");
    emit log_named_string("An empire won", WinningEmpire.get() != EEmpire.NULL ? "Yes" : "No");
    emit log_named_uint("Total sales", _log_sellPointsCount);
    emit log_named_uint("Total withdrawals", _log_withdrawEarningsCount);
    emit log_string("---");
  }

  /* -------------------------------------------------------------------------- */
  /*                                   GETTERS                                  */
  /* -------------------------------------------------------------------------- */

  /// @dev Get the actual pot (balance of the contract)
  function getPot() external view returns (uint256) {
    return Balances.get(EMPIRES_NAMESPACE_ID);
  }

  /// @dev Get the expected pot
  function getExpectedPot() external view returns (uint256) {
    return _mirrorPot;
  }

  /// @dev Get the actual rake
  function getRake() external view returns (uint256) {
    return Balances.get(ADMIN_NAMESPACE_ID);
  }

  /// @dev Get the expected rake
  function getExpectedRake() external view returns (uint256) {
    return _mirrorRake;
  }
}
