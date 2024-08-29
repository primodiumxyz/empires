import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { Address } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { entityToAddress, entityToPlanetName, WORLD_EVENTS } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
import { Price } from "@/components/shared/Price";
import { Username } from "@/components/shared/Username";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useSettings } from "@/hooks/useSettings";
import { EmpireEnumToConfig } from "@/util/lookups";

const { enabled, thresholds } = WORLD_EVENTS;
export type WorldEvent = {
  content: string | ReactNode;
  type: "whale" | "acidRain" | "shieldEater" | "citadel" | "planet" | "opportunity";
};

// TODO: empire taking the lead in planet count
/**
 * Prepare world events and emit them under a single stream.
 *
 * @returns A stream of world events to subscribe to
 */
export function useWorldEvents() {
  const {
    tables,
    utils: { usdToWei },
  } = useCore();
  const { showBanner } = useSettings();
  const callbackRef = useRef<((event: WorldEvent) => void) | undefined>(undefined);

  const { price } = useEthPrice();
  const ethSpentThreshold = useMemo(() => usdToWei(thresholds.dollarSpent, price ?? 0), [price]);

  const emit = useCallback((event: WorldEvent) => {
    if (callbackRef.current) callbackRef.current(event);
  }, []);

  const onEvent = useCallback((cb: (event: WorldEvent) => void) => {
    callbackRef.current = cb;
  }, []);

  const getPlanetSpan = (planetId: Entity) => {
    const empireId = tables.Planet.get(planetId)?.empireId;
    if (!empireId) return <span className="text-gray-400">{entityToPlanetName(planetId)}</span>;
    const colorClass = EmpireEnumToConfig[empireId as EEmpire].textColor;
    return <span className={colorClass}>{entityToPlanetName(planetId)}</span>;
  };

  const getEmpireSpan = (empireId: EEmpire) => (
    <span className={EmpireEnumToConfig[empireId].textColor}>{EmpireEnumToConfig[empireId].name} empire</span>
  );

  const getPlayerSpan = (playerId: Address) => (
    <span className="text-yellow-400">
      <Username address={entityToAddress(playerId)} />
    </span>
  );

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

                if (current.ethSpent >= ethSpentThreshold) {
                  emit({
                    content: (
                      <div>
                        {getPlayerSpan(current.playerId)} bought <Price wei={current.ethSpent} className="font-bold" />{" "}
                        worth of ships on {getPlanetSpan(current.planetId as Entity)}
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

                if (current.ethSpent >= ethSpentThreshold) {
                  emit({
                    content: (
                      <div>
                        {getPlayerSpan(current.playerId)} bought <Price wei={current.ethSpent} className="font-bold" />{" "}
                        worth of shields on {getPlanetSpan(current.planetId as Entity)}
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
                if (current.ethSpent >= ethSpentThreshold) {
                  emit({
                    content: (
                      <div>
                        {getPlayerSpan(current.playerId)} distributed {current.goldDistributed.toLocaleString()} gold
                        for <Price wei={current.ethSpent} className="font-bold" /> to{" "}
                        {getEmpireSpan(current.empireId as EEmpire)}
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
                if (gain >= ethSpentThreshold) {
                  emit({
                    content: (
                      <div>
                        {getPlayerSpan(entity)} just sold <Price wei={gain} className="font-bold" /> worth of points
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
                    {getEmpireSpan(current.empireId as EEmpire)} captured a citadel ({getPlanetSpan(planetId as Entity)}
                    ) from {getEmpireSpan(prev!.empireId as EEmpire)}
                  </div>
                ) : (
                  <div>
                    {getEmpireSpan(current.empireId as EEmpire)} was first to capture the{" "}
                    {getPlanetSpan(planetId as Entity)} citadel
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
                    content: <div>The price to support {getEmpireSpan(empireId as EEmpire)} could not be lower!</div>,
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
                        {getPlanetSpan(current.planetId as Entity)}
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
                        {getPlanetSpan(current.planetId as Entity)}
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
