import { Entity } from "@primodiumxyz/reactive-tables";
import { Hex } from "viem";
import { entityToAddress } from "@/utils/global/common";

export type LinkedAddressResult = {
  address: Hex | null;
  ensName: Hex | null;
};

/**
 * Retrieves the ENS name associated with the given player entity.
 * @param accountLinkUrl - The URL for the account link.
 * @param playerEntity - The player entity.
 * @param hard - Whether to force a hard retrieval.
 * @returns The linked address result.
 */
const addressMap = new Map<string, LinkedAddressResult>();
export const getEnsName = async (
  accountLinkUrl: string,
  playerEntity: Entity,
  hard?: boolean
): Promise<LinkedAddressResult> => {
  const address = entityToAddress(playerEntity);
  const retrievedData = addressMap.get(address);
  if (!hard && retrievedData) {
    return retrievedData;
  }

  try {
    const res = await fetch(`${accountLinkUrl}/ens/by-address/${address}`);
    const jsonRes = await res.json();
    addressMap.set(address, jsonRes as LinkedAddressResult);
    return jsonRes as LinkedAddressResult;
  } catch (error) {
    return { address: null, ensName: null } as LinkedAddressResult;
  }
};

/**
 * Removes a linked address from the address map.
 * @param address - The address to remove.
 */
export const removeLinkedAddress = (address: Hex) => {
  addressMap.delete(address);
};
