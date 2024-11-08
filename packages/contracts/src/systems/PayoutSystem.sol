// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Balances } from "@latticexyz/world/src/codegen/index.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { EMPIRES_NAMESPACE_ID, ADMIN_NAMESPACE_ID } from "src/constants.sol";
import { WinningEmpire, Empire, PayoutManager, RakeRecipient } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { idToAddress } from "src/utils.sol";
// import { P_GameConfig, WinningEmpire,  } from "codegen/index.sol";

/**
 * @title PayoutSystem
 * @dev A contract that manages the distribute funds to the players of the Empires game.
 */
contract PayoutSystem is EmpiresSystem {
  /**
   * @dev Allows a user to withdraw their accumulated rake.
   * todo This function should be restricted to the admin.
   */
  function distributeFunds() public _onlyAdmin {
    EEmpire winningEmpire = WinningEmpire.get();
    require(winningEmpire != EEmpire.NULL, "[PayoutSystem] No empire has won the game");

    uint256 empirePoints = Empire.getPointsIssued(winningEmpire);
    if (empirePoints == 0) {
      return;
    }

    uint256[] memory rake = new uint256[](1);
    rake[0] = (Balances.get(ADMIN_NAMESPACE_ID));

    address payoutManager = PayoutManager.getContractAddress();
    address[] memory rakeRecipient = new address[](1);
    rakeRecipient[0] = RakeRecipient.getRecipientAddress();

    // get winners
    (address[] memory winners, uint256[] memory payouts, uint256 pot) = getWinners();

    // record and send the rake
    // address is set and controlled by Primodium, so no reentrancy risk
    (bool success, bytes memory data) = payoutManager.call{ value: rake[0] }(
      abi.encodeWithSignature("record(address[],uint256[])", rakeRecipient, rake)
    );
    require(success, "PayoutSystem: failed to record rake");

    // record and send the pot and winners
    (success, data) = payoutManager.call{ value: pot }(
      abi.encodeWithSignature("record(address[],uint256[])", winners, payouts)
    );
    require(success, "PayoutSystem: failed to record winners");

    // increment round
    (success, data) = payoutManager.call(abi.encodeWithSignature("incrementRound()"));
    require(success, "PayoutSystem: failed to increment round");
  }

  /**
   * @dev Finds the winners of the game and their payouts.
   * @return winners The addresses of the winners.
   * @return payouts The payouts of the winners.
   * @dev seperate function to deal with stack too deep
   */
  function getWinners() internal view returns (address[] memory, uint256[] memory, uint256) {
    EEmpire winningEmpire = WinningEmpire.get();
    require(winningEmpire != EEmpire.NULL, "[PayoutSystem] No empire has won the game");

    uint256 empirePoints = Empire.getPointsIssued(winningEmpire);
    if (empirePoints == 0) {
      return (new address[](0), new uint256[](0), 0);
    }

    uint256 pot = (Balances.get(EMPIRES_NAMESPACE_ID));
    uint256[] memory rake = new uint256[](1);
    rake[0] = (Balances.get(ADMIN_NAMESPACE_ID));

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
}
