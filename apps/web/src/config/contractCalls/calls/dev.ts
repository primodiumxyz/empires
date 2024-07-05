import { encodeAbiParameters, Hex, TransactionReceipt } from "viem";

import { worldInput } from "@primodiumxyz/contracts/mud.config";
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
  ) {
    const tableId = table.id as Hex;
    const key = entityToHexKeyTuple(entity);

    return await execute({
      functionName: `${worldInput.namespace}__devDeleteRecord`,
      args: [tableId, key],
      txQueueOptions: {
        id: entity,
      },
    });
  }

  async function setTableValue<tableDef extends ContractTableDef = ContractTableDef>(
    table: ContractTable<tableDef>,
    keys: SchemaToPrimitives<ContractTable<tableDef>["metadata"]["abiKeySchema"]>,
    newValues: Partial<Properties<ContractTable<tableDef>["propertiesSchema"]>>,
  ) {
    const tableId = table.id as Hex;
    const schema = Object.keys(table.metadata.abiPropertiesSchema);
    const keyTuple = encodeKeys(table.metadata.abiKeySchema, keys);

    const results = await Promise.all(
      Object.entries(newValues).map(async ([name, value]) => {
        const type = table.metadata.abiPropertiesSchema[name] as StaticAbiType;
        const data = encodeField(type, value);
        const schemaIndex = schema.indexOf(name);

        try {
          return await execute({
            functionName: `${worldInput.namespace}__devSetField`,
            args: [tableId, keyTuple, schemaIndex, data],
            txQueueOptions: {
              id: uuid(),
              force: true,
            },
          });
        } catch (err) {
          console.error("Error setting table value", err);
          return false;
        }
      }),
    );

    return results.every((result) => result);
  }

  return {
    removeTable,
    setTableValue,
  };
}
