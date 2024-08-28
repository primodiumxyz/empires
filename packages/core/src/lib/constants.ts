import { parseEther } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { toHex32 } from "@core/utils";

/** Encoded keys. Used in prototype tables to prevent collisions  */
export const Keys = {
  SECONDARY: toHex32("secondary") as Entity,
};

export const STORAGE_PREFIX = "primodiumSessionKey:";

export const minEth = parseEther("0.0049");

export const TX_TIMEOUT = 5_000; // 5 seconds

export enum EViewMode {
  Map,
  Dashboard,
}

export const TREASURE_PLANET_GOLD_TRESHOLD = 100n;

export const PRICE_PRECISION = 4;

export const WORLD_EVENTS = {
  enabled: {
    // Transactions with high ETH value
    buyShips: true,
    buyShields: true,
    airdropGold: true,
    sellPoints: true,
    // Events with high ship/shield destroy count
    acidRain: true,
    shieldEater: true,
    // Citadel capture/change of ownership
    citadel: true,
    // Empire taking the lead in planet count
    planetCountLead: true,
    // Point price for an empire goes below a treshold
    pointsCheap: true,
  },
  thresholds: {
    // a transaction with an ETH value greater than this treshold happened (buy ships/shields, airdrop gold, sell points)
    ethSpent: parseEther("0.01"), // ~$25 at ETH $2,500
    // events with a ship destroy count greater than this treshold (acid rain)
    shipsDestroyed: 50n,
    // events with a shield destroy count greater than this treshold (shield eater)
    shieldsDestroyed: 50n,
  },
};
