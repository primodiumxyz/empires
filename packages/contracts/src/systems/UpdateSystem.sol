// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { NextTurnTimestamp, P_GameConfig } from "codegen/index.sol";

contract UpdateSystem is System {
  function _updateTurn() private returns (bool) {
    uint256 nextTurnTimestamp = NextTurnTimestamp.get();
    uint256 currentTime = block.timestamp;
    bool canUpdate = currentTime >= nextTurnTimestamp;
    if (canUpdate) {
      uint256 newNextTurnTimestamp = currentTime + P_GameConfig.get();
      NextTurnTimestamp.set(newNextTurnTimestamp);
    }
    return canUpdate;
  }

  function updateWorld() public returns (bool) {
    bool canUpdate = _updateTurn();
    if (!canUpdate) revert("[UpdateSystem] Cannot update yet");

    // todo: run planet update

    return true;
  }
}
