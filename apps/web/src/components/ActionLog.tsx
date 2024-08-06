import { useMemo } from "react";
import { BookOpenIcon } from "@heroicons/react/24/outline";

import { entityToPlanetName, formatAddress } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { AutoSizer } from "@/components/core/AutoSizer";
import { Modal } from "@/components/core/Modal";
import { useEthPrice } from "@/hooks/useEthPrice";

type ActionLogEntry = {
  actor: string;
  type: string;
  timestamp: bigint;
  details: string;
};

export const ActionLog = () => {
  const { tables, utils } = useCore();

  const moveActions = tables.MoveRoutineLog.useAll();
  const battleActions = tables.PlanetBattleRoutineLog.useAll();
  const buyActions = tables.BuyShipsRoutineLog.useAll();
  const buyShieldActions = tables.BuyShieldsRoutineLog.useAll();
  const createActions = tables.CreateShipOverrideLog.useAll();
  const killActions = tables.KillShipOverrideLog.useAll();
  const chargeShieldActions = tables.ChargeShieldsOverrideLog.useAll();
  const drainShieldActions = tables.DrainShieldsOverrideLog.useAll();
  const { price } = useEthPrice();

  const actions = useMemo(() => {
    const moveActionEntries = moveActions.map((actionEntity) => {
      const action = tables.MoveRoutineLog.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.originPlanetId as Entity),
        type: "Move",
        timestamp: action.timestamp,
        details: `Ship moved: ${action.shipCount}, Origin: ${entityToPlanetName(action.originPlanetId as Entity)}, Dest: ${entityToPlanetName(action.destinationPlanetId as Entity)}`,
      };
    });

    const battleActionEntries = battleActions.map((actionEntity) => {
      const action = tables.PlanetBattleRoutineLog.get(actionEntity)!;
      return {
        actor: entityToPlanetName(action.planetId as Entity),
        type: "Battle",
        timestamp: action.timestamp,
        details: `Planet: ${entityToPlanetName(action.planetId as Entity)}, Attack Ct: ${action.attackingShipCount}, Defend Ct: ${action.defendingShipCount}`,
      };
    });

    const buyActionEntries = buyActions.map((actionEntity) => {
      const action = tables.BuyShipsRoutineLog.get(actionEntity)!;
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
      const action = tables.BuyShieldsRoutineLog.get(actionEntity)!;
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

  return (
    <Modal title="Action Log">
      <Modal.Button size="md" className="h-[58px] w-fit" variant="info">
        <BookOpenIcon className="size-8" />
      </Modal.Button>
      <Modal.Content className="h-screen !w-[400px] md:h-3/4">
        <AutoSizer
          items={actions}
          itemSize={70}
          render={(action) => {
            return (
              <div className="rounded border border-white/20 bg-white/20 p-1 text-sm">
                <p className="font-bold">
                  {action.type} ({action.actor})
                </p>
                <p className="text-[0.7rem]">{action.details}</p>
                <p className="text-xs text-gray-300">{new Date(Number(action.timestamp) * 1000).toLocaleString()}</p>
              </div>
            );
          }}
        />
      </Modal.Content>
    </Modal>
  );
};
