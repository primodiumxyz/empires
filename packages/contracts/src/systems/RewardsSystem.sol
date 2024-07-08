// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { EmpiresSystem, WinningEmpire } from "systems/EmpiresSystem.sol";
import { P_GameConfig } from "codegen/index.sol";

contract RewardsSystem is EmpiresSystem {
  modifier _onlyGameOver() {
    uint256 endBlock = P_GameConfig.getGameOverBlock();
    require(endBlock > 0 && block.number > endBlock, "[RewardsSystem] Game is not over");
    _;
  }

  function claimVictory(EEmpire empire) public _onlyGameOver {
    // todo: victory condition

    WinningEmpire.set(empire);
  }

  function withdrawEarnings() public _onlyGameOver {
    require(WinningEmpire.get() !== EEmpire.NULL, "[RewardsSystem] No empire has won the game");

    // todo: distribute rewards
  }
}
