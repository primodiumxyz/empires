import { useMemo } from "react";

import { entityToPlanetName, formatAddress } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useEthPrice } from "@/hooks/useEthPrice";

type ActionLogEntry = {
  actor: string;
  type: string;
  timestamp: bigint;
  details: string;
};

export const ActionLog = () => {
  const { tables, utils } = useCore();

  const moveActions = tables.MoveNPCAction.useAll();
  const battleActions = tables.BattleNPCAction.useAll();
  const buyActions = tables.BuyDestroyersNPCAction.useAll();
  const createActions = tables.CreateDestroyerPlayerAction.useAll();
  const killActions = tables.KillDestroyerPlayerAction.useAll();
  const { price } = useEthPrice();

  const actions = useMemo(() => {
    const moveActionEntries = moveActions.map((actionEntity) => {
      const action = tables.MoveNPCAction.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.originPlanetId as Entity),
        type: "Move",
        timestamp: action.timestamp,
        details: `Ship moved: ${action.shipCount}, Origin: ${entityToPlanetName(action.originPlanetId as Entity)}, Dest: ${entityToPlanetName(action.destinationPlanetId as Entity)}`,
      };
    });

    const battleActionEntries = battleActions.map((actionEntity) => {
      const action = tables.BattleNPCAction.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Battle",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Attack Ct: ${action.attackingShipCount}, Defend Ct: ${action.defendingShipCount}`,
      };
    });

    const buyActionEntries = buyActions.map((actionEntity) => {
      const action = tables.BuyDestroyersNPCAction.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Buy Ships",
        timestamp: action.timestamp,
        details: `Ships Bought: ${action.destroyerBought}, Gold spent: ${action.goldSpent}, Planet: ${entityToPlanetName(action.planetId as Entity)}`,
      };
    });

    const createActionEntries = createActions.map((actionEntity) => {
      const action = tables.CreateDestroyerPlayerAction.get(actionEntity)!;
      return {
        actor: formatAddress(action.playerId, true),
        type: "Create Ships",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Ships created: ${action.newDestroyerCount}, USD Spent: ${utils.ethToUSD(action.ethSpent, price ?? 0)}`,
      };
    });

    const killActionEntries = killActions.map((actionEntity) => {
      const action = tables.KillDestroyerPlayerAction.get(actionEntity)!;
      return {
        actor: formatAddress(action.playerId, true),
        type: "Kill Ships",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Ship destroyed: ${action.newDestroyerCount}, USD Spent: ${utils.ethToUSD(action.ethSpent, price ?? 0)}`,
      };
    });

    const allActions = [
      ...moveActionEntries,
      ...battleActionEntries,
      ...buyActionEntries,
      ...createActionEntries,
      ...killActionEntries,
    ];
    allActions.sort((a, b) => Number(b.timestamp - a.timestamp));
    return allActions;
  }, [moveActions, battleActions, buyActions, createActions, killActions]);

  return (
    <div className="absolute bottom-4 left-4 flex h-3/4 w-72 flex-col gap-2 overflow-y-auto rounded bg-secondary p-4 text-white">
      <h2 className="mb-2 text-xs font-bold uppercase">Action Log</h2>
      {actions.map((action, index) => (
        <div key={index} className="rounded border border-white/20 bg-white/20 p-1 text-sm">
          <p className="font-bold">
            {action.type} ({action.actor})
          </p>
          <p className="text-[0.7rem]">{action.details}</p>
          <p className="text-xs text-gray-300">{new Date(Number(action.timestamp) * 1000).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
