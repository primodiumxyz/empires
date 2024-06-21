// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

function addressToEntity(address a) pure returns (bytes32) {
  return bytes32(uint256(uint160((a))));
}

function entityToAddress(bytes32 a) pure returns (address) {
  return address(uint160(uint256((a))));
}

function bytes32ToString(bytes32 data) pure returns (string memory) {
  bytes memory bytesString = new bytes(32);
  for (uint256 i = 0; i < 32; i++) {
    bytesString[i] = data[i];
  }
  return string(bytesString);
}
