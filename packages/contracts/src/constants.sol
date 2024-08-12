// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import { EEmpire } from "codegen/common.sol";

import { ResourceId, TYPE_BITS } from "@latticexyz/store/src/ResourceId.sol";
import { RESOURCE_NAMESPACE } from "@latticexyz/world/src/worldResourceTypes.sol";

// this is done in this annoying way because the compiler wont allow using the library function
ResourceId constant EMPIRES_NAMESPACE_ID = ResourceId.wrap(
  bytes32(RESOURCE_NAMESPACE) | (bytes32("Empires") >> (TYPE_BITS))
);

ResourceId constant ADMIN_NAMESPACE_ID = ResourceId.wrap(
  bytes32(RESOURCE_NAMESPACE) | (bytes32("Admin") >> (TYPE_BITS))
);
