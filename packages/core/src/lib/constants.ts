import { parseEther } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { toHex32 } from "@/utils";

/** Encoded keys. Used in prototype tables to prevent collisions  */
export const Keys = {
  SECONDARY: toHex32("secondary") as Entity,
};

export const STORAGE_PREFIX = "primodiumSessionKey:";

export const minEth = parseEther("0.0049");
