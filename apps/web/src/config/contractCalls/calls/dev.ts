import { worldInput } from "contracts/mud.config";
import { encodeAbiParameters, Hex, TransactionReceipt } from "viem";

import { ExecuteFunctions } from "@primodiumxyz/core";
import {
  AbiKeySchema,
  AbiToSchema,
  ContractTable,
  ContractTableDef,
  Entity,
  Properties,
} from "@primodiumxyz/reactive-tables";
import {
  encodeField,
  // encodeKeys,
  entityToHexKeyTuple,
  SchemaToPrimitives,
  StaticAbiType,
  uuid,
} from "@primodiumxyz/reactive-tables/utils";

// TODO(TEMP): remove when RETA updated (import from utils)
export const encodeKeys = (abiKeySchema: AbiKeySchema, keys: Properties<AbiToSchema<AbiKeySchema>>): Hex[] => {
  const staticFields = Object.values(abiKeySchema);
  return Object.values(keys).map((key, index) => encodeAbiParameters([{ type: staticFields[index] }], [key]));
};

export function createDevCalls({ execute }: ExecuteFunctions) {
  async function removeTable<tableDef extends ContractTableDef = ContractTableDef>(
    table: ContractTable<tableDef>,
    entity: Entity,
    onComplete?: (receipt: TransactionReceipt | undefined) => void,
  ) {
    const tableId = table.id as Hex;
    const key = entityToHexKeyTuple(entity);

    await execute({
      functionName: `${worldInput.namespace}__devDeleteRecord`,
      args: [tableId, key],
      txQueueOptions: {
        id: entity,
      },
      onComplete,
    });
  }

  async function setTableValue<tableDef extends ContractTableDef = ContractTableDef>(
    table: ContractTable<tableDef>,
    keys: SchemaToPrimitives<ContractTable<tableDef>["metadata"]["abiKeySchema"]>,
    newValues: Partial<Properties<ContractTable<tableDef>["propertiesSchema"]>>,
    onComplete?: (receipt: TransactionReceipt | undefined) => void,
  ) {
    const tableId = table.id as Hex;
    const schema = Object.keys(table.metadata.abiPropertiesSchema);
    const keyTuple = encodeKeys(table.metadata.abiKeySchema, keys);

    return Object.entries(newValues).forEach(async ([name, value]) => {
      const type = table.metadata.abiPropertiesSchema[name] as StaticAbiType;
      const data = encodeField(type, value);
      const schemaIndex = schema.indexOf(name);
      await execute({
        functionName: `${worldInput.namespace}__devSetField`,
        args: [tableId, keyTuple, schemaIndex, data],
        txQueueOptions: {
          id: uuid(),
          force: true,
        },
        onComplete,
      });
    });
  }

  return {
    removeTable,
    setTableValue,
  };
}
