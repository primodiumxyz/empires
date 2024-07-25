// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

struct Likelihoods {
  bytes32 planetId;
  uint256 buyShields;
  uint256 attackEnemy;
  uint256 accumulateGold;
  uint256 buyShips;
  uint256 supportAlly;
  // used for attack enemy and supportAlly
  bytes32 attackTargetId;
  bytes32 supportTargetId;
}
