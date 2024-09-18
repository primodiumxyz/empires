// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { Nonce } from "codegen/index.sol";

function addressToId(address a) pure returns (bytes32) {
  return bytes32(uint256(uint160((a))));
}

function idToAddress(bytes32 a) pure returns (address) {
  return address(uint160(uint256((a))));
}

function bytes32ToString(bytes32 data) pure returns (string memory) {
  bytes memory bytesString = new bytes(32);
  for (uint256 i = 0; i < 32; i++) {
    bytesString[i] = data[i];
  }
  return string(bytesString);
}

function coordToId(int128 q, int128 r) pure returns (bytes32) {
  return bytes32((uint256(uint128(q)) << 128) | uint128(r));
}

function pseudorandom(uint256 seed, uint256 max) view returns (uint256) {
  return uint256(keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao, block.number))) % max;
}

function pseudorandomEntity() returns (bytes32) {
  uint256 nonce = Nonce.get();
  Nonce.set(nonce + 1);
  return bytes32(keccak256(abi.encode(nonce)));
}
