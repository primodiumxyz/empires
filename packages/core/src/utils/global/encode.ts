import { resourceToHex } from "@latticexyz/common";
import { Entity } from "@primodiumxyz/reactive-tables";
import { encodeEntity } from "@primodiumxyz/reactive-tables/utils";
import {
  Hex,
  encodeAbiParameters,
  isHex,
  keccak256,
  size,
  sliceHex,
  toHex,
} from "viem";

/**
 * Generates a system ID based on name and namespace.
 * @param name - The name of the system.
 * @param namespace - The namespace of the system.
 * @returns The system ID.
 */
export const getSystemId = (name: string, namespace = "Pri_11"): Hex => {
  return resourceToHex({
    type: "system",
    name,
    namespace: namespace.toLowerCase() == "core" ? "" : namespace,
  });
};

/**
 * Converts an address to an entity.
 * @param address - The address to convert.
 * @returns The converted entity.
 */
export const addressToEntity = (address: Hex): Entity => {
  return encodeAbiParameters([{ type: "address" }], [address]) as Entity;
};

/**
 * Converts input to a 32-byte hex string.
 * @param input - The input value.
 * @returns The 32-byte hex string.
 */
export const toHex32 = (input: string | number | bigint | boolean): Hex => {
  return toHex(input, { size: 32 });
};

/**
 * Encodes a number entity.
 * @param key - The key of the entity.
 * @param entity - The value of the entity.
 * @returns The encoded entity.
 */
export function encodeNumberEntity(key: number, entity: string): Entity {
  return encodeEntity(
    { key: "uint16", entity: "bytes32" },
    { key, entity: toHex32(entity) }
  );
}

/**
 * Encodes a key entity.
 * @param key - The key of the entity.
 * @param entity - The value of the entity.
 * @returns The encoded entity.
 */
export function encodeKeyEntity(key: string, entity: string): Entity {
  return encodeEntity(
    { key: "bytes32", entity: "bytes32" },
    { key: toHex32(key), entity: toHex32(entity) }
  );
}

/**
 * Hashes entities.
 * @param args - The entities to hash.
 * @returns The hashed entity.
 */
export function hashEntities(...args: (Entity | string | number)[]): Entity {
  const values = args.reduce((prev, arg) => `${prev}${arg}`, "") as Hex;
  return keccak256(values) as Entity;
}

/**
 * Hashes a key entity.
 * @param key - The key of the entity.
 * @param entity - The value of the entity.
 * @returns The hashed entity.
 */
export function hashKeyEntity(key: Hex, entity: Entity): Entity {
  return keccak256(
    encodeAbiParameters(
      [
        { name: "key", type: "bytes32" },
        { name: "entity", type: "bytes32" },
      ],
      [key, entity as Hex]
    )
  ) as Entity;
}

/**
 * Converts an entity to a hex key tuple.
 * @param entity - The entity to convert.
 * @returns The hex key tuple.
 */
export function entityToHexKeyTuple(entity: Entity): readonly Hex[] {
  if (!isHex(entity)) {
    throw new Error(`entity ${entity} is not a hex string`);
  }
  const length = size(entity);
  if (length % 32 !== 0) {
    throw new Error(`entity length ${length} is not a multiple of 32 bytes`);
  }
  return new Array(length / 32)
    .fill(0)
    .map((_, index) => sliceHex(entity, index * 32, (index + 1) * 32));
}
