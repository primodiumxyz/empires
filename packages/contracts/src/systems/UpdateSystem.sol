// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { NextTurnBlock, P_GameConfig } from "codegen/index.sol";

contract UpdateSystem is System {
  function _updateTurn() private returns (bool) {
    uint256 nextTurnBlock = NextTurnBlock.get();
    bool canUpdate = block.number >= nextTurnBlock;
    if (canUpdate) {
      uint256 newNextTurnBlock = block.number + P_GameConfig.get();
      NextTurnBlock.set(newNextTurnBlock);
    }
    return canUpdate;
  }

  function updateWorld() public returns (bool) {
    bool canUpdate = _updateTurn();
    if (!canUpdate) revert("UpdateSystem: cannot update yet");

    // todo: run planet update

    return true;
  }
}
