import { useEffect, useState } from "react";
import { formatEther } from "viem";

import { entityToPlanetName, formatAddress } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

type ActionLogEntry = {
  actor: string;
  type: string;
  timestamp: bigint;
  details: string;
};

export const ActionLog = () => {
  const { tables } = useCore();

  const moveActions = tables.MoveNPCAction.useAll();
  const battleActions = tables.BattleNPCAction.useAll();
  const buyActions = tables.BuyDestroyersNPCAction.useAll();
  const createActions = tables.CreateDestroyerPlayerAction.useAll();
  const killActions = tables.KillDestroyerPlayerAction.useAll();

  const [actions, setActions] = useState<ActionLogEntry[]>([]);

  useEffect(() => {
    const moveActionEntries = moveActions.map((actionEntity) => {
      const action = tables.MoveNPCAction.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.originPlanetId as Entity),
        type: "Move",
        timestamp: action.timestamp,
        details: `Moved ${action.shipCount} ships from ${entityToPlanetName(action.originPlanetId as Entity)} to ${entityToPlanetName(action.destinationPlanetId as Entity)}`,
      };
    });

    const battleActionEntries = battleActions.map((actionEntity) => {
      const action = tables.BattleNPCAction.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Battle",
        timestamp: action.timestamp,
        details: `Battle at ${entityToPlanetName(action.planetId as Entity)}: ${action.attackingShipCount} vs ${action.defendingShipCount}. Conquered: ${action.conquer}`,
      };
    });

    const buyActionEntries = buyActions.map((actionEntity) => {
      const action = tables.BuyDestroyersNPCAction.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Buy",
        timestamp: action.timestamp,
        details: `Bought ${action.destroyerBought} destroyers for ${formatEther(action.goldSpent)} gold at ${entityToPlanetName(action.planetId as Entity)}`,
      };
    });

    const createActionEntries = createActions.map((actionEntity) => {
      const action = tables.CreateDestroyerPlayerAction.get(actionEntity)!;
      return {
        actor: formatAddress(action.playerId, true),
        type: "Create Ships",
        timestamp: action.timestamp,
        details: `At ${entityToPlanetName(action.planetId as Entity)}. Ship count: ${action.newDestroyerCount}. Spent: ${formatEther(action.ethSpent)}ETH`,
      };
    });

    const killActionEntries = killActions.map((actionEntity) => {
      const action = tables.KillDestroyerPlayerAction.get(actionEntity)!;
      return {
        actor: formatAddress(action.playerId, true),
        type: "Kill Ships",
        timestamp: action.timestamp,
        details: `At ${entityToPlanetName(action.planetId as Entity)}. Ship count: ${action.newDestroyerCount}. Spent: ${formatEther(action.ethSpent)}ETH`,
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
    setActions(allActions);
  }, [moveActions, battleActions, buyActions, createActions, killActions]);

  return (
    <div className="absolute bottom-4 left-4 flex max-h-96 w-72 flex-col gap-2 overflow-y-auto rounded bg-secondary p-4 text-white">
      <h2 className="mb-2 text-xs font-bold uppercase">Action Log</h2>
      {actions.map((action, index) => (
        <div key={index} className="rounded border border-white/20 bg-white/20 p-1 text-sm">
          <p className="font-bold">
            {action.type} ({action.actor})
          </p>
          <p className="text-[0.7rem]">{action.details}</p>
          <p className="text-xs text-gray-400">{new Date(Number(action.timestamp) * 1000).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
