pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";

/**
 * @title TickSystem
 * @dev A contract called by the keeper to force indexer parameter updates of balances
 */
contract TickSystem is EmpiresSystem {
  function tick() public payable _onlyNotGameOver {
    uint256 cost = 1 wei;
    require(_msgValue() >= cost, "[TickSystem] Insufficient payment");
  }
}
