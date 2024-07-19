import { Address } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { entityToAddress } from "@core/utils/global/common";
import { hashEntities } from "@core/utils/global/encode";

/**
 * Formats a raw name by inserting spaces and handling camelCase.
 * @param rawName - The raw name to format.
 * @returns The formatted name.
 */
export const formatName = (rawName: string): string => {
  return rawName
    .replace(/([A-Z])([0-9])/g, "$1 $2") // Insert a space between an uppercase letter and a number.
    .replace(/([0-9])([A-Z])/g, "$1 $2") // Insert a space between a number and an uppercase letter.
    .replace(/([a-z])([0-9])/g, "$1 $2") // Insert a space between a lowercase letter and a number.
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // Insert a space between consecutive uppercase letters where the second one is followed by lowercase letter (camelCase).
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle general camelCase like "minePlatinum".
    .trimStart();
};

const entityPlanetName = new Map<Entity, string>();
/**
 * Converts an entity to a planet name.
 * @param entity - The entity to convert.
 * @returns The planet name.
 */
export const entityToPlanetName = (entity: Entity): string => {
  if (entityPlanetName.has(entity)) return entityPlanetName.get(entity) as string;

  const hash = hashEntities(entity);

  const prefix1 = parseInt(hash.substring(0, 4), 16) % 26;
  const prefix2 = parseInt(hash.substring(4, 8), 16) % 26;
  const number = parseInt(hash.substring(8, 12), 16) % 251;
  const suffix = parseInt(hash.substring(12, 16), 16) % 26;

  const name = `${String.fromCharCode(65 + prefix1)}${String.fromCharCode(
    65 + prefix2,
  )} ${number} ${String.fromCharCode(65 + suffix)}`;

  entityPlanetName.set(entity, name);

  return name;
};

export const formatAddress = (address: Address, entity?: true) => {
  const formattedAddress = entity ? entityToAddress(address) : address;
  return `${formattedAddress.slice(0, 5)}...${formattedAddress.slice(-3)}`;
};
