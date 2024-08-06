import { useMemo, useRef } from "react";

import { entityToPlanetName, formatAddress } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { AutoSizer } from "@/components/core/AutoSizer";
import { useEthPrice } from "@/hooks/useEthPrice";
import { cn } from "@/util/client";

type ActionLogEntry = {
  actor: string;
  type: string;
  timestamp: bigint;
  details: string;
};

export const ActionLog = () => {
  const { tables, utils } = useCore();

  const moveActions = tables.MoveRoutine.useAll();
  const battleActions = tables.PlanetBattleRoutine.useAll();
  const buyActions = tables.BuyShipsRoutine.useAll();
  const buyShieldActions = tables.BuyShieldsRoutine.useAll();
  const createActions = tables.CreateShipOverrideLog.useAll();
  const killActions = tables.KillShipOverrideLog.useAll();
  const chargeShieldActions = tables.ChargeShieldsOverrideLog.useAll();
  const drainShieldActions = tables.DrainShieldsOverrideLog.useAll();
  const { price } = useEthPrice();

  const actions = useMemo(() => {
    const moveActionEntries = moveActions.map((actionEntity) => {
      const action = tables.MoveRoutine.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.originPlanetId as Entity),
        type: "Move",
        timestamp: action.timestamp,
        details: `Ship moved: ${action.shipCount}, Origin: ${entityToPlanetName(action.originPlanetId as Entity)}, Dest: ${entityToPlanetName(action.destinationPlanetId as Entity)}`,
      };
    });

    const battleActionEntries = battleActions.map((actionEntity) => {
      const action = tables.PlanetBattleRoutine.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Battle",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Attack Ct: ${action.attackingShipCount}, Defend Ct: ${action.defendingShipCount}`,
      };
    });

    const buyActionEntries = buyActions.map((actionEntity) => {
      const action = tables.BuyShipsRoutine.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Buy Ships",
        timestamp: action.timestamp,
        details: `Ships Bought: ${action.shipBought}, Gold spent: ${action.goldSpent}, Planet: ${entityToPlanetName(action.planetId as Entity)}`,
      };
    });

    const createActionEntries = createActions.map((actionEntity) => {
      const action = tables.CreateShipOverrideLog.get(actionEntity)!;
      return {
        actor: formatAddress(action.playerId, true),
        type: "Create Ships",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, USD Spent: ${utils.weiToUsd(action.ethSpent, price ?? 0)}`,
      };
    });

    const killActionEntries = killActions.map((actionEntity) => {
      const action = tables.KillShipOverrideLog.get(actionEntity)!;
      return {
        actor: formatAddress(action.playerId, true),
        type: "Kill Ships",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, USD Spent: ${utils.weiToUsd(action.ethSpent, price ?? 0)}`,
      };
    });

    const chargeShieldActionEntries = chargeShieldActions.map((actionEntity) => {
      const action = tables.ChargeShieldsOverrideLog.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Charge Shield",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Shield Charged`,
      };
    });

    const drainShieldActionEntries = drainShieldActions.map((actionEntity) => {
      const action = tables.DrainShieldsOverrideLog.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Drain Shield",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Shield Drained`,
      };
    });

    const buyShieldActionEntries = buyShieldActions.map((actionEntity) => {
      const action = tables.BuyShieldsRoutine.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Buy Shield",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Shield Bought ${action.shieldBought}`,
      };
    });

    const allActions = [
      ...moveActionEntries,
      ...battleActionEntries,
      ...buyActionEntries,
      ...createActionEntries,
      ...killActionEntries,
      ...chargeShieldActionEntries,
      ...drainShieldActionEntries,
      ...buyShieldActionEntries,
    ];
    allActions.sort((a, b) => Number(b.timestamp - a.timestamp));
    return allActions;
  }, [moveActions, battleActions, buyActions, createActions, killActions]);
  const now = Date.now();

  const bottomEl = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    bottomEl?.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="pointer-events-auto h-[200px] w-[300px] flex-grow overflow-y-auto p-4">
      <AutoSizer
        items={actions}
        itemSize={80}
        render={(action) => {
          return (
            <div className={cn("mb-2 text-xs", now - Number(action.timestamp) * 1000 > 15 * 1000 ? "opacity-50" : "")}>
              <span className="font-bold text-blue-400">{action.actor}: </span>
              <span className="text-white">
                {action.type} - {action.details}
              </span>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(Number(action.timestamp) * 1000).toLocaleString()}
              </div>
            </div>
          );
        }}
      />
      <div ref={bottomEl}></div>
    </div>
  );
};
