import { ReactNode, useCallback, useEffect, useRef } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { WORLD_EVENTS } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
import { Price } from "@/components/shared/Price";
import { useSettings } from "@/hooks/useSettings";
import { EmpireEnumToConfig } from "@/util/lookups";

import { EmpireSpan, PlanetSpan, PlayerSpan } from "./useActions";

const { enabled, thresholds } = WORLD_EVENTS;
export type WorldEvent = {
  content: string | ReactNode;
  type: "whale" | "acidRain" | "shieldEater" | "citadel" | "planet" | "opportunity";
};

// TODO: use threshold in dollar instead of eth
// TODO: empire taking the lead in planet count
/**
 * Prepare world events and emit them under a single stream.
 *
 * @returns A stream of world events to subscribe to
 */
export function useWorldEvents() {
  const { tables, utils } = useCore();
  const { showBanner } = useSettings();
  const callbackRef = useRef<((event: WorldEvent) => void) | undefined>(undefined);

  const emit = useCallback((event: WorldEvent) => {
    if (callbackRef.current) callbackRef.current(event);
  }, []);

  const onEvent = useCallback((cb: (event: WorldEvent) => void) => {
    callbackRef.current = cb;
  }, []);

  useEffect(() => {
    if (!showBanner.enabled) return;

    const unsubscribes = [
      // A player making a large transaction
      // - buying a lot of ships
      enabled.buyShips
        ? tables.CreateShipOverrideLog.watch(
            {
              onEnter: ({ properties: { current } }) => {
                if (!current) return;

                if (current.ethSpent >= thresholds.ethSpent) {
                  emit({
                    content: (
                      <div>
                        <PlayerSpan playerId={current.playerId} /> bought{" "}
                        <Price wei={current.ethSpent} className="font-bold" /> worth of ships on{" "}
                        <PlanetSpan planetId={current.planetId as Entity} />
                      </div>
                    ),
                    type: "whale",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
      // - buying a lot of shields
      enabled.buyShields
        ? tables.ChargeShieldsOverrideLog.watch(
            {
              onEnter: ({ properties: { current } }) => {
                if (!current) return;

                if (current.ethSpent >= thresholds.ethSpent) {
                  emit({
                    content: (
                      <div>
                        <PlayerSpan playerId={current.playerId} /> bought{" "}
                        <Price wei={current.ethSpent} className="font-bold" /> worth of shields on{" "}
                        <PlanetSpan planetId={current.planetId as Entity} />
                      </div>
                    ),
                    type: "whale",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
      // - buying a lot of points (airdropping gold)
      enabled.airdropGold
        ? tables.AirdropGoldOverrideLog.watch(
            {
              onEnter: ({ properties: { current } }) => {
                if (!current) return;
                if (current.ethSpent >= thresholds.ethSpent) {
                  emit({
                    content: (
                      <div>
                        <PlayerSpan playerId={current.playerId} /> distributed{" "}
                        {current.goldDistributed.toLocaleString()} gold for{" "}
                        <Price wei={current.ethSpent} className="font-bold" /> to{" "}
                        <EmpireSpan empireId={current.empireId as EEmpire} />
                      </div>
                    ),
                    type: "whale",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
      // Selling points for a large amount of ETH
      enabled.sellPoints
        ? tables.Value_PlayersMap.watch(
            {
              onChange: ({ entity, properties: { current, prev } }) => {
                const gain = (current?.gain ?? 0n) - (prev?.gain ?? 0n);
                if (gain >= thresholds.ethSpent) {
                  emit({
                    content: (
                      <div>
                        <PlayerSpan playerId={entity} /> just sold <Price wei={gain} className="font-bold" /> worth of
                        points
                      </div>
                    ),
                    type: "whale",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
      // Planets captures
      tables.Planet.watch(
        {
          onChange: ({ entity, properties: { current, prev } }) => {
            if (current?.empireId === prev?.empireId) return;
            const { id: planetId } = decodeEntity(tables.Planet.metadata.abiKeySchema, entity);
            const prevEmpire = prev?.empireId ? EmpireEnumToConfig[prev.empireId as EEmpire].name : undefined;
            const newEmpire = EmpireEnumToConfig[current!.empireId as EEmpire].name;

            // - a citadel being captured/changing ownership
            const isCitadel = current?.isCitadel;
            if (enabled.citadel && isCitadel) {
              emit({
                content: prevEmpire ? (
                  <div>
                    <EmpireSpan empireId={current.empireId as EEmpire} /> captured a citadel (
                    <PlanetSpan planetId={planetId as Entity} />
                    ) from <EmpireSpan empireId={prev!.empireId as EEmpire} />
                  </div>
                ) : (
                  <div>
                    <EmpireSpan empireId={current.empireId as EEmpire} /> was first to capture the{" "}
                    <PlanetSpan planetId={planetId as Entity} /> citadel
                  </div>
                ),
                type: "citadel",
              });
            }

            // TODO: an empire just took the lead in planet count
            // Emit only if the top planet just took the lead
            // if (enabled.planetCountLead) {
            //   const allPlanets = tables.Planet.getAll().map((entity) => tables.Planet.get(entity));
            //   const planetCounts = allPlanets.reduce((acc, planet) => {
            //     const empireId = planet?.empireId;
            //     if (!empireId) return acc;
            //     acc[empireId] = (acc[empireId] || 0) + 1;
            //     return acc;
            //   }, {} as Record<EEmpire, number>);
          },
        },
        { runOnInit: false },
      ),
      // Points for an empire became super cheap
      enabled.pointsCheap
        ? tables.Empire.watch(
            {
              onChange: ({ entity, properties: { current, prev } }) => {
                const config = tables.P_PointConfig.get();
                if (!current || !prev || !config) return;

                if (current.pointCost <= config.minPointCost && prev.pointCost > config.minPointCost) {
                  const { id: empireId } = decodeEntity(tables.Empire.metadata.abiKeySchema, entity);

                  emit({
                    content: (
                      <div>
                        The price to support <EmpireSpan empireId={empireId as EEmpire} /> could not be lower!
                      </div>
                    ),
                    type: "opportunity",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
      // An acid rain destroyed a large amount of ships
      enabled.acidRain
        ? tables.AcidDamageOverrideLog.watch(
            {
              onEnter: ({ properties: { current } }) => {
                if (!current) return;
                if (current?.shipsDestroyed >= thresholds.shipsDestroyed) {
                  emit({
                    content: (
                      <div>
                        An acid Rain destroyed {current.shipsDestroyed.toLocaleString()} ships on{" "}
                        <PlanetSpan planetId={current.planetId as Entity} />
                      </div>
                    ),
                    type: "acidRain",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
      // The shield eater destroyed a large amount of shields
      enabled.shieldEater
        ? tables.ShieldEaterDamageOverrideLog.watch(
            {
              onEnter: ({ properties: { current } }) => {
                if (!current) return;
                if (current?.shieldsDestroyed >= thresholds.shieldsDestroyed) {
                  emit({
                    content: (
                      <div>
                        Shield Eater destroyed {current.shieldsDestroyed.toLocaleString()} shields on{" "}
                        <PlanetSpan planetId={current.planetId as Entity} />
                      </div>
                    ),
                    type: "shieldEater",
                  });
                }
              },
            },
            { runOnInit: false },
          )
        : undefined,
    ];

    return () => {
      unsubscribes.forEach((unsub) => unsub?.());
    };
  }, [tables, emit, showBanner]);

  return { onEvent };
}
