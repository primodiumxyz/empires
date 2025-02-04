import { Address } from "viem";

import { entityToAddress } from "@core/utils/global/common";

/**
 * Formats a raw name by inserting spaces and handling camelCase.
 *
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

export const formatAddress = (address: Address, entity?: true) => {
  const formattedAddress = entity ? entityToAddress(address) : address;
  return `${formattedAddress.slice(0, 5)}...${formattedAddress.slice(-3)}`;
};
