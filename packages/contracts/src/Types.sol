// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

struct RoutineThresholds {
  bytes32 planetId;
  // represented as thresholds up to 10000. Sorted from least to most active
  uint256 accumulateGold;
  uint256 buyShields;
  uint256 buyShips;
  uint256 moveShips;
  bytes32 moveTargetId;
}

struct CoordData {
  int128 q;
  int128 r;
}
