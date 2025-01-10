import { Hex } from "viem";

import { worldInput } from "@primodiumxyz/contracts/mud.config";
import { ExecuteCallOptions, ExecuteFunctions, WorldAbiType } from "@primodiumxyz/core";
import { ContractTable, ContractTableDef, Properties } from "@primodiumxyz/reactive-tables";
import { encodeField, encodeKeys, SchemaToPrimitives, StaticAbiType, uuid } from "@primodiumxyz/reactive-tables/utils";

/* ---------------------------------- Types --------------------------------- */

type TableBaseOperation<tableDef extends ContractTableDef = ContractTableDef> = {
  table: ContractTable<tableDef>;
  keys: SchemaToPrimitives<ContractTable<tableDef>["metadata"]["abiKeySchema"]>;
};

type TablePropertiesOperation<tableDef extends ContractTableDef = ContractTableDef> = TableBaseOperation<tableDef> & {
  properties: Partial<Properties<ContractTable<tableDef>["propertiesSchema"]>>;
};

export type TableOperation<tableDef extends ContractTableDef = ContractTableDef> =
  | TableBaseOperation<tableDef>
  | TablePropertiesOperation<tableDef>;

export const createDevCalls = ({ execute, executeBatch }: ExecuteFunctions) => {
  /* -------------------------------- Internal -------------------------------- */

  const _removeTableRecord = <tableDef extends ContractTableDef = ContractTableDef>({
    table,
    keys,
  }: TableBaseOperation<tableDef>): ExecuteCallOptions<
    WorldAbiType,
    `${typeof worldInput.namespace}__devDeleteRecord`
  > => {
    const tableId = table.id as Hex;
    const keyTuple = encodeKeys(table.metadata.abiKeySchema, keys);
    return {
      functionName: `${worldInput.namespace}__devDeleteRecord` as const,
      args: [tableId, keyTuple],
    };
  };

  const _setTableProperties = <tableDef extends ContractTableDef = ContractTableDef>({
    table,
    keys: _keys,
    properties,
  }: TablePropertiesOperation<tableDef>): Array<
    ExecuteCallOptions<WorldAbiType, `${typeof worldInput.namespace}__devSetField`>
  > => {
    const tableId = table.id as Hex;
    const keys = Object.fromEntries(Object.keys(table.metadata.abiKeySchema).map((key) => [key, _keys[key]]));
    const schema = Object.keys(table.metadata.abiPropertiesSchema);
    const keyTuple = encodeKeys(table.metadata.abiKeySchema, keys);

    return Object.entries(properties).map(([name, value]) => {
      const type = table.metadata.abiPropertiesSchema[name] as StaticAbiType;
      const data = encodeField(type, value);
      const schemaIndex = schema.indexOf(name);

      return {
        functionName: `${worldInput.namespace}__devSetField` as const,
        args: [tableId, keyTuple, schemaIndex, data],
        options: {
          gas: 1_000_000n,
        },
      };
    });
  };

  /* --------------------------------- Single --------------------------------- */

  const removeTableRecord = async <tableDef extends ContractTableDef = ContractTableDef>(
    operation: TableBaseOperation<tableDef>,
  ) => {
    return await execute({
      ..._removeTableRecord(operation),
      txQueueOptions: { id: uuid() },
    });
  };

  const setTableProperties = async <tableDef extends ContractTableDef = ContractTableDef>(
    operation: TablePropertiesOperation<tableDef>,
  ) => {
    const systemCalls = _setTableProperties(operation);
    return await executeBatch({
      systemCalls,
      txQueueOptions: { id: uuid() },
    });
  };

  /* ---------------------------------- Batch --------------------------------- */

  const setOrRemoveBatch = async (
    operations: (TableBaseOperation<ContractTableDef> | TablePropertiesOperation<ContractTableDef>)[],
  ) => {
    const systemCalls = operations.flatMap((operation) => {
      if ("properties" in operation) {
        return _setTableProperties(operation);
      }
      return [_removeTableRecord(operation)];
    });

    return await executeBatch({
      systemCalls,
      txQueueOptions: { id: uuid() },
    });
  };

  /* --------------------------------- Helpers -------------------------------- */

  const createTableBaseOperation = <tableDef extends ContractTableDef = ContractTableDef>(
    operation: TableBaseOperation<tableDef>,
  ): TableBaseOperation<ContractTableDef> => operation as unknown as TableBaseOperation<ContractTableDef>;

  const createTablePropertiesOperation = <tableDef extends ContractTableDef = ContractTableDef>(
    operation: TablePropertiesOperation<tableDef>,
  ): TablePropertiesOperation<ContractTableDef> => operation as unknown as TablePropertiesOperation<ContractTableDef>;

  const createTableBaseParams = <tableDef extends ContractTableDef = ContractTableDef>(
    operation: TableBaseOperation<tableDef>,
  ) => _removeTableRecord(operation);

  const createTablePropertiesParams = <tableDef extends ContractTableDef = ContractTableDef>(
    operation: TablePropertiesOperation<tableDef>,
  ) => _setTableProperties(operation);

  return {
    remove: removeTableRecord,
    setProperties: setTableProperties,
    batch: setOrRemoveBatch,
    // for type safety when creating batch operations
    createRemove: createTableBaseOperation,
    createSetProperties: createTablePropertiesOperation,
    // to create batch operations externally
    createRemoveParams: createTableBaseParams,
    createSetPropertiesParams: createTablePropertiesParams,
  };
};
