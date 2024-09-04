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

export const CHART_TIME_SCALES = [
  { value: 600, label: "10min" },
  { value: 3_600, label: "1h" },
  { value: 86_400, label: "24h" },
  { value: -1, label: "All time" },
];
export const CHART_TICK_INTERVALS = [
  { value: 600, label: "10min" },
  { value: 3_600, label: "1h" },
];

export const TREASURE_PLANET_GOLD_THRESHOLD = 100n;

export const PRICE_PRECISION = 4;

export const WORLD_EVENTS_THRESHOLDS = {
  // a transaction with an ETH value greater than this treshold happened (buy ships/shields, airdrop gold, sell points)
  dollarSpent: 25, // $25
  // selling points for more than this treshold (sell points)
  generationalWealth: 50, // $50
  // events with a ship destroy count greater than this treshold (acid rain)
  shipsDestroyed: 30n,
  // events with a shield destroy count greater than this treshold (shield eater)
  shieldsDestroyed: 30n,
};
