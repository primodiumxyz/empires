import { useCallback, useEffect, useRef } from "react";
import { parseEther } from "viem";

import { Entity } from "@primodiumxyz/reactive-tables";
import { useCore } from "@core/react/hooks/useCore";
import { entityToPlanetName } from "@core/utils";

export type WorldEvent = {
  content: string;
  type: "whale" | "acidRain" | "shieldEater" | "citadel" | "planet" | "opportunity";
};

/* -------------------------------- Tresholds -------------------------------- */
const TRANSACTION_VALUE_THRESHOLD = parseEther("0.1");
const SHIP_DESTROY_THRESHOLD = 1n;
const SHIELD_DESTROY_THRESHOLD = 100n;
const EMPIRE_POINT_PRICE_THRESHOLD = parseEther("0.0001");

/**
 * Prepare world events and emit them under a single stream.
 *
 * @returns A stream of world events to subscribe to
 */
export function useWorldEvents() {
  const { tables } = useCore();
  const callbackRef = useRef<((event: WorldEvent) => void) | undefined>(undefined);

  const emit = useCallback((event: WorldEvent) => {
    if (callbackRef.current) callbackRef.current(event);
  }, []);

  const onEvent = useCallback((cb: (event: WorldEvent) => void) => {
    callbackRef.current = cb;
  }, []);

  useEffect(() => {
    const unsubscribes = [
      // - a player making a large transaction
      //    - buying a lot of ships/shields
      //    - buying a lot of points
      //    - selling a lot of points
      // - the shield eater destroying a large amount of shields
      // - a citadel being captured/changing ownership
      // - an empire taking the lead in amount of planets owned
      // - points for an empire getting super cheap
      // - an acid rain destroying a large amount of ships
      tables.AcidDamageOverrideLog.watch(
        {
          onEnter: ({ properties: { current } }) => {
            console.log("AcidDamageOverrideLog", current);
            if (!current) return;
            if (current?.shipsDestroyed >= SHIP_DESTROY_THRESHOLD) {
              emit({
                content: `Acid Rain destroyed ${current.shipsDestroyed} ships on ${entityToPlanetName(current.planetId as Entity)}`,
                type: "acidRain",
              });
            }
          },
        },
        { runOnInit: false },
      ),
    ];

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [tables, emit]);

  return { onEvent };
}
