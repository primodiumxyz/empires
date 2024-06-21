import { renderList, renderedSolidityHeader } from "@latticexyz/common/codegen";
import { StaticAbiType } from "@latticexyz/schema-type/internal";
import { WorldInput } from "@latticexyz/world/ts/config/v2/input";
import { renderPrototypeScript } from "./renderPrototypeScript";
import { ConfigWithPrototypes } from "./types";

export function renderPrototypes(config: ConfigWithPrototypes<WorldInput>) {
  const names = Object.keys(config.prototypeConfig);
  const enums = config.worldInput.enums ?? [];
  const outputs = names.map((name) => renderPrototype(config, name)).join("\n");

  const output = `
  ${renderedSolidityHeader}

  import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
  import { IStore } from "@latticexyz/store/src/IStore.sol";
  import { Schema } from "@latticexyz/store/src/Schema.sol";
  import { EncodedLengths } from "@latticexyz/store/src/EncodedLengths.sol";

  ${
    Object.keys(enums).length > 0
      ? `import { ${Object.keys(enums)
          .map((e) => e)
          .join(",")} } from "../common.sol";`
      : ""
  }
  import "codegen/index.sol";


  ${renderCreatePrototype()}
  ${renderPrototypeScript(config.prototypeConfig)}
  ${outputs}
  `;
  return output;
}

export function renderCreatePrototype() {
  return `
  function createPrototype(
    IStore store,
    bytes32[] memory key,
    ResourceId[] memory tableIds,
    bytes[] memory staticData,
    EncodedLengths[] memory encodedLengths,
  bytes[] memory dynamicData
) {
  for (uint256 i = 0; i < tableIds.length; i++) {
    ResourceId tableId = tableIds[i];
    store.setRecord(tableId, key, staticData[i], encodedLengths[i], dynamicData[i]);
  }
}
  `;
}

export function renderPrototype<W extends WorldInput>(config: ConfigWithPrototypes<W>, name: string) {
  const prototype = config.prototypeConfig[name];
  const keys = prototype.keys !== undefined ? prototype.keys : [{ [`${name}PrototypeId`]: "bytes32" }];

  const keyTupleDefinition = `

    bytes32[] memory _keyTuple = new bytes32[](${Object.entries(keys).length});
  ${keys
    .map((key, index) =>
      renderList(
        Object.entries(key),
        (key) =>
          `_keyTuple[${index}] = ${renderValueTypeToBytes32(key[0], {
            typeUnwrap: "",
            internalTypeId: key[1],
          })};`
      )
    )
    .join("")}`;

  const levelPrototype = renderLevelPrototype(config, name);
  const tables = prototype.tables;
  const length = tables ? Object.keys(tables).length : 0;

  const ret = `
  bytes32 constant ${name}PrototypeId = "${name}";

  function ${name}Keys() pure returns (bytes32[] memory) {
    ${keyTupleDefinition}
        return _keyTuple;
  }

  ${levelPrototype ? levelPrototype.levelKeys : ""}
  function ${name}Prototype(IStore store) {
    ${
      tables
        ? `
    bytes32[] memory keys = ${name}Keys();
    ResourceId[] memory tableIds = new ResourceId[](${length});
    bytes[] memory staticData =  new bytes[](${length});
      EncodedLengths[] memory encodedLengths = new EncodedLengths[](${length});
      bytes[] memory dynamicData = new bytes[](${length});

    ${Object.keys(tables)
      .map((key, i) => `tableIds[${i}] = ${key}._tableId;`)
      .join("")}

    ${Object.entries(tables)
      .map(([tableName, value], i) => (value ? renderSetRecord(config, tableName, value, i) : ""))
      .join("")}

    createPrototype(store, keys, tableIds, staticData, encodedLengths, dynamicData);`
        : ""
    }

    ${levelPrototype ? levelPrototype.levelFunctionCalls : ""}
  }
    ${levelPrototype ? levelPrototype.levels : ""}
`;
  return ret;
}

export function renderLevelPrototype<W extends WorldInput>(config: ConfigWithPrototypes<W>, name: string) {
  const prototype = config.prototypeConfig[name];

  const keys: { [x: string]: StaticAbiType }[] =
    prototype.keys !== undefined ? prototype.keys : [{ [`${name}PrototypeId`]: "bytes32" }];
  keys.push({ level: "uint32" });
  const values = prototype.levels;
  if (!values) return undefined;

  const keyTupleDefinition = `
    bytes32[] memory _keyTuple = new bytes32[](${Object.entries(keys).length});
    
    ${keys
      .map((key, index) =>
        renderList(
          Object.entries(key),
          (key) =>
            `_keyTuple[${index}] = ${renderValueTypeToBytes32(key[0], {
              typeUnwrap: "",
              internalTypeId: key[1],
            })};`
        )
      )
      .join("")}`;

  const renderLevels = Object.entries(values)
    .map(([level, value]) => {
      return `
    /* ----------------------------- LEVEL ${level} ----------------------------- */
    function create${name}Level${level}(IStore store) {
      bytes32[] memory levelKeys = ${name}LevelKeys(${level});
      ResourceId[] memory tableIds = new ResourceId[](${Object.keys(value).length});
      bytes[] memory staticData =  new bytes[](${Object.keys(value).length});
      EncodedLengths[] memory encodedLengths = new EncodedLengths[](${Object.keys(value).length});
      bytes[] memory dynamicData = new bytes[](${Object.keys(value).length});

      ${Object.keys(value)
        .map((key, i) => `tableIds[${i}] = ${key}._tableId;`)
        .join("")}

      ${Object.entries(value)
        .map(([tableName, v], i) => (v ? renderSetRecord(config, tableName, v, i, level) : ""))
        .join("")}

      createPrototype(store, levelKeys, tableIds, staticData, encodedLengths, dynamicData);
    }
    `;
    })
    .join("");

  const levelFunctionCalls = Object.entries(values)
    .map(([level]) => {
      return `create${name}Level${level}(store);`;
    })
    .join("");
  return {
    levelKeys: `function ${name}LevelKeys(uint32 level) pure returns (bytes32[] memory) {
    ${keyTupleDefinition}
        return _keyTuple;
  }`,
    levelFunctionCalls,
    levels: `
    ${renderLevels} 
`,
  };
}

export const renderSetRecord = <W extends WorldInput>(
  config: ConfigWithPrototypes<W>,
  tableName: string,
  value: { [k: string]: number },
  i: number,
  level?: string
) => {
  const tables = config.worldInput.tables;
  if (!tables) return;
  const { key, schema: rawSchema } = tables[tableName];
  const schema = Object.fromEntries(Object.entries(rawSchema).filter(([schemaKey]) => !key.includes(schemaKey)));

  // Iterate through the keys in the original valueSchema to preserve ordering
  const formattedValues = Object.keys(schema).map((fieldName) => {
    const fieldValue = value[fieldName];

    const variableName = `${tableName.toLowerCase()}_${level ? "_level_" : ""}${fieldName}`;
    const fieldType = schema[fieldName];
    const isArray = Array.isArray(fieldValue);

    if (isArray) {
      const declaration = `${fieldType} memory ${variableName} = new ${fieldType}(${fieldValue.length});`;
      const assignments = fieldValue.map((v, i) => `${variableName}[${i}] = ${formatValue(config, fieldType, v)};`);

      return {
        declaration: [declaration, ...assignments].join(""),
        name: variableName,
        formattedValue: null,
      };
    }

    return {
      declaration: null,
      name: null,
      formattedValue: formatValue(config, fieldType, fieldValue),
    };
  });

  return `${formattedValues.find((v) => v.declaration) ? formattedValues.map((v) => v.declaration).join("") : ""}
(staticData[${i}], encodedLengths[${i}], dynamicData[${i}]) = ${tableName}.encode(${formattedValues
    .map((v) => (v.name ? v.name : v.formattedValue))
    .join(",")});`;
};

export function renderValueTypeToBytes32(
  name: string,
  { typeUnwrap, internalTypeId }: { typeUnwrap: string; internalTypeId: string }
): string {
  const innerText = typeUnwrap.length ? `${typeUnwrap}(${name})` : name;
  if (internalTypeId === "bytes32") {
    return innerText;
  } else if (internalTypeId.match(/^bytes\d{1,2}$/)) {
    return `bytes32(${innerText})`;
  } else if (internalTypeId.match(/^uint\d{1,3}$/)) {
    return `bytes32(uint256(${innerText}))`;
  } else if (internalTypeId.match(/^int\d{1,3}$/)) {
    return `bytes32(uint256(int256(${innerText})))`;
  } else if (internalTypeId === "address") {
    return `bytes32(uint256(uint160(${innerText})))`;
  } else if (internalTypeId === "bool") {
    return `_boolToBytes32(${innerText})`;
  } else {
    throw new Error(`Unknown value type id ${internalTypeId}`);
  }
}

const formatValue = <W extends WorldInput>(
  config: ConfigWithPrototypes<W>,
  fieldType: string,
  value: number | string
) => {
  const enums = config.worldInput.enums ?? [];
  if (fieldType in enums) {
    return `${fieldType}(uint8(${value}))`;
  } else if (typeof value === "string" && value.includes("0x")) {
    return `${value}`;
  } else if (fieldType.includes("bytes")) {
    return `"${value}"`;
  }
  return `${value}`;
};
