// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { System } from "@latticexyz/world/src/System.sol";
import { FieldLayout } from "@latticexyz/store/src/FieldLayout.sol";
import { EncodedLengths } from "@latticexyz/store/src/EncodedLengths.sol";
import { ResourceId } from "@latticexyz/world/src/WorldResourceId.sol";
import { StoreSwitch } from "@latticexyz/store/src/StoreSwitch.sol";

contract DevSystem is System {
  /**
   * Write a record in the table at the given tableId.
   */
  function devSetRecord(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    bytes calldata staticData,
    EncodedLengths encodedLengths,
    bytes calldata dynamicData
  ) public {
    // Set the record
    StoreSwitch.setRecord(tableId, keyTuple, staticData, encodedLengths, dynamicData);
  }

  function devSpliceStaticData(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint48 start,
    bytes calldata data
  ) public {
    // Splice the static data
    StoreSwitch.spliceStaticData(tableId, keyTuple, start, data);
  }

  function devSpliceDynamicData(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    uint40 startWithinField,
    uint40 deleteCount,
    bytes calldata data
  ) public {
    // Splice the dynamic data
    StoreSwitch.spliceDynamicData(tableId, keyTuple, dynamicFieldIndex, startWithinField, deleteCount, data);
  }

  /**
   * Write a field in the table at the given tableId.
   */
  function devSetField(ResourceId tableId, bytes32[] calldata keyTuple, uint8 fieldIndex, bytes calldata data) public {
    // Set the field
    StoreSwitch.setField(tableId, keyTuple, fieldIndex, data);
  }

  /**
   * Write a field in the table at the given tableId.
   */
  function devSetField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 fieldIndex,
    bytes calldata data,
    FieldLayout fieldLayout
  ) public {
    // Set the field
    StoreSwitch.setField(tableId, keyTuple, fieldIndex, data, fieldLayout);
  }

  /**
   * Write a static field in the table at the given tableId.
   */
  function devSetStaticField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 fieldIndex,
    bytes calldata data,
    FieldLayout fieldLayout
  ) public {
    // Set the field
    StoreSwitch.setStaticField(tableId, keyTuple, fieldIndex, data, fieldLayout);
  }

  /**
   * Write a dynamic field in the table at the given tableId.
   */
  function devSetDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    bytes calldata data
  ) public {
    // Set the field
    StoreSwitch.setDynamicField(tableId, keyTuple, dynamicFieldIndex, data);
  }

  /**
   * Push data to the end of a field in the table at the given tableId.
   */
  function devPushToDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    bytes calldata dataToPush
  ) public {
    // Push to the field
    StoreSwitch.pushToDynamicField(tableId, keyTuple, dynamicFieldIndex, dataToPush);
  }

  /**
   * Pop data from the end of a field in the table at the given tableId.
   */
  function devPopFromDynamicField(
    ResourceId tableId,
    bytes32[] calldata keyTuple,
    uint8 dynamicFieldIndex,
    uint256 byteLengthToPop
  ) public {
    // Push to the field
    StoreSwitch.popFromDynamicField(tableId, keyTuple, dynamicFieldIndex, byteLengthToPop);
  }

  /**
   * Delete a record in the table at the given tableId.
   */
  function devDeleteRecord(ResourceId tableId, bytes32[] calldata keyTuple) public {
    // Delete the record
    StoreSwitch.deleteRecord(tableId, keyTuple);
  }
}
