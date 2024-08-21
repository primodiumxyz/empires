import { Address } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { entityToAddress } from "@core/utils/global/common";
import { hashEntities } from "@core/utils/global/encode";

const prefixes = [
  "Zy",
  "Xe",
  "Vo",
  "Ne",
  "Ar",
  "Io",
  "Ux",
  "El",
  "Ry",
  "Ka",
  "Bi",
  "Mu",
  "Fy",
  "Ja",
  "Lo",
  "Wi",
  "Pu",
  "Sy",
  "Ga",
  "Jour",
  "Zoro",
  "Waz",
  "Ord",
  "Micro",
  "Macro",
  "Nano",
  "Blue",
  "Femto",
  "Atto",
  "Zepto",
  "Yoto",
];
const suffixes = [
  "thor",
  "noxia",
  "ria",
  "luxo",
  "ton",
  "plex",
  "thoo",
  "dor",
  "mira",
  "zar",
  "vex",
  "quin",
  "fire",
  "seff",
  "nova",
  "fluu",
  "glow",
  "roe",
  "eta",
  "aura",
  "olio",
  "lanta",
  "sona",
  "garra",
  "ra",
  "bar",
  "taco",
  "plex",
  "zone",
];

const entityPlanetName = new Map<Entity, string>();

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

/**
 * Converts an entity to a planet name.
 * @param entity - The entity to convert.
 * @returns The planet name.
 */
export const entityToPlanetName = (entity: Entity): string => {
  if (entityPlanetName.has(entity)) return entityPlanetName.get(entity) as string;

  const hash = hashEntities(entity);

  const prefixIndex = parseInt(hash.substring(8, 12), 16) % prefixes.length;
  const suffixIndex = parseInt(hash.substring(4, 8), 16) % suffixes.length;

  const name = `${prefixes[prefixIndex]}${suffixes[suffixIndex]}`;

  entityPlanetName.set(entity, name);

  return name;
};

export const formatAddress = (address: Address, entity?: true) => {
  const formattedAddress = entity ? entityToAddress(address) : address;
  return `${formattedAddress.slice(0, 5)}...${formattedAddress.slice(-3)}`;
};
