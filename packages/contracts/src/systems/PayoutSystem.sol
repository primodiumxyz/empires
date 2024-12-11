// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/tables/Balances.sol";
import { Systems } from "@latticexyz/world/src/codegen/tables/Systems.sol";

import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { RESOURCE_SYSTEM, RESOURCE_NAMESPACE } from "@latticexyz/world/src/worldResourceTypes.sol";
import { ResourceId, WorldResourceIdLib, WorldResourceIdInstance } from "@latticexyz/world/src/WorldResourceId.sol";

import { IWorld } from "codegen/world/IWorld.sol";
import { WinningEmpire, Empire, PayoutManager, RakeRecipient } from "codegen/index.sol";
// import { P_GameConfig, WinningEmpire,  } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { WithdrawRakeSystem } from "systems/WithdrawRakeSystem.sol";

import { PlayersMap } from "adts/PlayersMap.sol";
import { PointsMap } from "adts/PointsMap.sol";

import { idToAddress } from "src/utils.sol";

import { PayoutManager as PayoutManagerContract } from "../../test/mocks/PayoutManager.sol";
import { console } from "forge-std/console.sol";

/**
 * @title PayoutSystem
 * @dev A contract that manages the distribute funds to the players of the Empires game.
 */
contract PayoutSystem is EmpiresSystem {
  IWorld world;
  PayoutManagerContract payoutManager;

  receive() external payable {}

  function distributeFunds() public _onlyAdmin {
    world = IWorld(_world());
    EEmpire winningEmpire = WinningEmpire.get();
    require(winningEmpire != EEmpire.NULL, "[PayoutSystem] No empire has won the game");

    uint256 empirePoints = Empire.getPointsIssued(winningEmpire);
    if (empirePoints == 0) {
      return;
    }

    uint256[] memory rake = new uint256[](1);
    rake[0] = (Balances.get(ADMIN_NAMESPACE_ID));

    payoutManager = PayoutManagerContract(PayoutManager.getContractAddress());
    address[] memory rakeRecipient = new address[](1);
    rakeRecipient[0] = RakeRecipient.getRecipientAddress();

    // get winners
    (address[] memory winners, uint256[] memory payouts, uint256 pot) = getWinners();

    // record and send the rake
    // address is set and controlled by Primodium, so no reentrancy risk
    bool success;
    bytes memory data;
    uint256 value = 0;

    ResourceId payoutSystemId = WorldResourceIdLib.encode({
      typeId: RESOURCE_SYSTEM,
      namespace: WorldResourceIdInstance.getNamespace(EMPIRES_NAMESPACE_ID),
      name: "PayoutSystem"
    });

    address payoutSystemAddress = Systems.getSystem(payoutSystemId);
    console.log("payoutSystemAddress", payoutSystemAddress);
    console.log("address(this)", address(this));

    console.log("world:", address(world));

    // this will fail because the payout system doesn't have the world funds
    // for either the empires namespace, or the admin namespace.

    // retrieve the funds to this contract
    console.log("Empires balance: %d", Balances.get(EMPIRES_NAMESPACE_ID));
    console.log("Admin balance: %d", Balances.get(ADMIN_NAMESPACE_ID));
    console.log("PayoutSystem address balance: %d", address(payoutSystemAddress).balance);

    world.transferBalanceToNamespace(ADMIN_NAMESPACE_ID, EMPIRES_NAMESPACE_ID, Balances.get(ADMIN_NAMESPACE_ID));
    world.transferBalanceToAddress(EMPIRES_NAMESPACE_ID, payoutSystemAddress, Balances.get(EMPIRES_NAMESPACE_ID));

    console.log("Empires balance: %d", Balances.get(EMPIRES_NAMESPACE_ID));
    console.log("Admin balance: %d", Balances.get(ADMIN_NAMESPACE_ID));
    console.log("PayoutSystem address balance: %d", address(payoutSystemAddress).balance);

    payoutManager.record{ value: rake[0] }(rakeRecipient, rake);
    payoutManager.record{ value: pot }(winners, payouts);
    payoutManager.incrementRound();
  }

  /**
   * @dev Finds the winners of the game and their payouts.
   * @return winners The addresses of the winners.
   * @return payouts The payouts of the winners.
   * @dev separate function to deal with stack too deep
   */
  function getWinners() public returns (address[] memory, uint256[] memory, uint256) {
    EEmpire winningEmpire = WinningEmpire.get();
    require(winningEmpire != EEmpire.NULL, "[PayoutSystem] No empire has won the game");

    uint256 empirePoints = Empire.getPointsIssued(winningEmpire);
    if (empirePoints == 0) {
      return (new address[](0), new uint256[](0), 0);
    }

    uint256 pot = (Balances.get(EMPIRES_NAMESPACE_ID));

    // get winners
    bytes32[] memory players = PlayersMap.keys();
    address[] memory tempWinners = new address[](players.length);
    uint256[] memory tempPayouts = new uint256[](players.length);
    uint256 playerPoints;
    uint256 playerIndex;
    uint256 payout;
    uint256 winnerCount = 0;

    // we are restricting player count for this release.
    for (playerIndex = 0; playerIndex < players.length; playerIndex++) {
      playerPoints = PointsMap.getValue(winningEmpire, players[playerIndex]);
      if (playerPoints > 0) {
        payout = (playerPoints * pot) / empirePoints;
        tempWinners[winnerCount] = idToAddress(players[playerIndex]);
        tempPayouts[winnerCount] = payout;
        winnerCount++;
      }
    }

    address[] memory winners = new address[](winnerCount);
    uint256[] memory payouts = new uint256[](winnerCount);

    for (playerIndex = 0; playerIndex < winnerCount; playerIndex++) {
      winners[playerIndex] = tempWinners[playerIndex];
      payouts[playerIndex] = tempPayouts[playerIndex];
    }

    return (winners, payouts, pot);
  }

  function getPaymanOwner() public returns (address) {
    address payoutManagerAddress = PayoutManager.getContractAddress();
    require(payoutManagerAddress != address(0), "PayoutSystem: payout manager not set");
    address owner = address(0);
    (bool success, bytes memory data) = payoutManagerAddress.call(abi.encodeWithSignature("getOwner()"));

    require(success, "PayoutSystem: failed to get owner");
    console.logBytes(data);
    (owner) = abi.decode(data, (address));
    return owner;
  }

  function testTransfer() public {
    console.log("Empires balance: %d", Balances.get(EMPIRES_NAMESPACE_ID));
    console.log("Admin balance: %d", Balances.get(ADMIN_NAMESPACE_ID));
    uint amount = Balances.get(ADMIN_NAMESPACE_ID);
    world.transferBalanceToNamespace(ADMIN_NAMESPACE_ID, EMPIRES_NAMESPACE_ID, amount);

    console.log("Empires balance: %d", Balances.get(EMPIRES_NAMESPACE_ID));
    console.log("Admin balance: %d", Balances.get(ADMIN_NAMESPACE_ID));
  }

  function registerWithPayman() internal {
    payoutManager = PayoutManagerContract(PayoutManager.getContractAddress());
    require(address(payoutManager) != address(0), "PayoutSystem: payout manager not set");
    payoutManager.setPayoutManagerSystem(address(this));
  }
}
