// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import { EEmpire } from "codegen/common.sol";

bytes14 constant EMPIRES_NAMESPACE_ID = bytes14("Empires");
uint256 constant POINTS_UNIT = 100e15;
uint256 constant OTHER_EMPIRE_COUNT = uint256(EEmpire.LENGTH) - 2;