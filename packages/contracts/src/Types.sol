// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

struct Likelihoods {
  bytes32 planetId;
  // represented as thresholds up to 10000. Sorted from least to most active
  uint256 accumulateGold;
  uint256 buyShields;
  uint256 buyShips;
  uint256 supportAlly;
  uint256 attackEnemy;
  // used for attack enemy and supportAlly
  bytes32 supportTargetId;
  bytes32 attackTargetId;
}
