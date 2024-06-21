import { StaticAbiType } from "@latticexyz/schema-type/internal";
import { SchemaInput } from "@latticexyz/store/config/v2";
import { ConfigFieldTypeToPrimitiveType as FieldToPrimitive } from "@latticexyz/store/internal";
import { WorldInput } from "@latticexyz/world/ts/config/v2/input";

type OmitSchemaKeys<Schema, Keys extends readonly string[]> = Omit<Schema, Keys[number]>;

export type TablesInput = {
  readonly [key: string]: TableInput;
};

export type TableInput = {
  readonly schema: SchemaInput;
  readonly key: readonly string[];
};

type TableStructureWithOmittedKeys<Table extends TableInput> = {
  [Field in keyof OmitSchemaKeys<Table["schema"], Table["key"]>]: FieldToPrimitive<Table["schema"][Field]>;
};

type Tables<W extends TablesInput> = {
  [TableName in keyof W]?: TableStructureWithOmittedKeys<W[TableName]>;
};

export type PrototypeConfig<W extends TablesInput> = {
  keys?: { [x: string]: StaticAbiType }[];
  tables?: Tables<W>;
  levels?: Record<number, Tables<W>>;
};

export type PrototypesConfig<W extends TablesInput> = Record<string, PrototypeConfig<W>>;

export type ConfigWithPrototypes<W extends WorldInput = WorldInput, Tables extends TablesInput = TablesInput> = {
  worldInput: W;
  prototypeConfig: PrototypesConfig<Tables>;
};
