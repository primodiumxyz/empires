import { toHex32 } from "@core/utils";
import { parseEther } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";

/** Encoded keys. Used in prototype tables to prevent collisions  */
export const Keys = {
  SECONDARY: toHex32("secondary") as Entity,
};

export const STORAGE_PREFIX = "primodiumSessionKey:";

export const minEth = parseEther("0.0049");

export const TX_TIMEOUT = 60_000; // 1 minute
