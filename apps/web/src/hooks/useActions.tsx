import { useMemo } from "react";
import { Address } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName, formatAddress, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useEthPrice } from "@/hooks/useEthPrice";

export const EmpireEnumToTextColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "text-blue-400",
  [EEmpire.Green]: "text-green-400",
  [EEmpire.Red]: "text-red-400",
  [EEmpire.LENGTH]: "",
};

export const useActions = () => {
  const { tables, utils } = useCore();

  const moveRoutines = tables.MoveRoutine.useAll();
  const planetBattleRoutines = tables.PlanetBattleRoutine.useAll();
  const buyShipsRoutines = tables.BuyShipsRoutine.useAll();
  const buyShieldsRoutines = tables.BuyShieldsRoutine.useAll();
  const accumulateGoldRoutines = tables.AccumulateGoldRoutine.useAll();

  const createShipOverrides = tables.CreateShipOverrideLog.useAll();
  const killShipOverrides = tables.KillShipOverrideLog.useAll();
  const chargeShieldsOverrides = tables.ChargeShieldsOverrideLog.useAll();
  const drainShieldsOverrides = tables.DrainShieldsOverrideLog.useAll();
  const placeMagnetOverrides = tables.PlaceMagnetOverrideLog.useAll();
  const boostChargeOverrides = tables.BoostChargeOverrideLog.useAll();
  const stunChargeOverrides = tables.StunChargeOverrideLog.useAll();
  const tacticalStrikeOverrides = tables.TacticalStrikeOverrideLog.useAll();
  const { price } = useEthPrice();

  return useMemo(() => {
    const getPlanetSpan = (planetId: Entity) => {
      const empireId = tables.Planet.get(planetId)?.empireId ?? EEmpire.LENGTH;
      const colorClass = EmpireEnumToTextColor[empireId as EEmpire];
      return <span className={colorClass}>{entityToPlanetName(planetId)}</span>;
    };

    const getPlayerSpan = (playerId: Address) => (
      <span className="text-yellow-400">{formatAddress(playerId, true)}</span>
    );

    const accumulateGoldRoutineEntries = accumulateGoldRoutines.map((actionEntity) => {
      const action = tables.AccumulateGoldRoutine.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.goldAdded)} gold
          </p>
        ),
      };
    });

    const moveRoutineEntries = moveRoutines.map((actionEntity) => {
      const action = tables.MoveRoutine.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.originPlanetId as Entity)} moved {formatNumber(action.shipCount)} ships to{" "}
            {getPlanetSpan(action.destinationPlanetId as Entity)}
          </p>
        ),
      };
    });

    const planetBattleRoutineEntries = planetBattleRoutines.map((actionEntity) => {
      const action = tables.PlanetBattleRoutine.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            A battle on {getPlanetSpan(action.planetId as Entity)} attacked {formatNumber(action.attackingShipCount)}{" "}
            ships and defended {formatNumber(action.defendingShipCount)} ships
          </p>
        ),
      };
    });

    const buyShipsRoutineEntries = buyShipsRoutines.map((actionEntity) => {
      const action = tables.BuyShipsRoutine.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} bought {formatNumber(action.shipBought)} ships for{" "}
            {utils.weiToUsd(action.goldSpent, price ?? 0)}
          </p>
        ),
      };
    });

    const createShipOverrideEntries = createShipOverrides.map((actionEntity) => {
      const action = tables.CreateShipOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} created {formatNumber(action.overrideCount)} ships on{" "}
            {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const killShipOverrideEntries = killShipOverrides.map((actionEntity) => {
      const action = tables.KillShipOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} killed {formatNumber(action.overrideCount)} ships on{" "}
            {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const chargeShieldsOverrideEntries = chargeShieldsOverrides.map((actionEntity) => {
      const action = tables.ChargeShieldsOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} charged {formatNumber(action.overrideCount)} shields on{" "}
            {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const drainShieldsOverrideEntries = drainShieldsOverrides.map((actionEntity) => {
      const action = tables.DrainShieldsOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} drained {formatNumber(action.overrideCount)} shields on{" "}
            {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const buyShieldsRoutineEntries = buyShieldsRoutines.map((actionEntity) => {
      const action = tables.BuyShieldsRoutine.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.shieldBought)} shields
          </p>
        ),
      };
    });

    const placeMagnetOverrideEntries = placeMagnetOverrides.map((actionEntity) => {
      const action = tables.PlaceMagnetOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} placed a magnet on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const boostChargeOverrideEntries = boostChargeOverrides.map((actionEntity) => {
      const action = tables.BoostChargeOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} boosted charge on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const stunChargeOverrideEntries = stunChargeOverrides.map((actionEntity) => {
      const action = tables.StunChargeOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} stunned charge on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const tacticalStrikeOverrideEntries = tacticalStrikeOverrides.map((actionEntity) => {
      const action = tables.TacticalStrikeOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: <p className="text-xs">Tactical Strike performed on {getPlanetSpan(action.planetId as Entity)}</p>,
      };
    });

    const allActions = [
      ...moveRoutineEntries,
      ...planetBattleRoutineEntries,
      ...buyShipsRoutineEntries,
      ...createShipOverrideEntries,
      ...killShipOverrideEntries,
      ...chargeShieldsOverrideEntries,
      ...drainShieldsOverrideEntries,
      ...buyShieldsRoutineEntries,
      ...placeMagnetOverrideEntries,
      ...boostChargeOverrideEntries,
      ...stunChargeOverrideEntries,
      ...tacticalStrikeOverrideEntries,
      ...accumulateGoldRoutineEntries,
    ];
    allActions.sort((a, b) => -Number(b.timestamp - a.timestamp));
    return allActions;
  }, [
    moveRoutines,
    planetBattleRoutines,
    buyShipsRoutines,
    createShipOverrides,
    killShipOverrides,
    chargeShieldsOverrides,
    drainShieldsOverrides,
    buyShieldsRoutines,
    placeMagnetOverrides,
    boostChargeOverrides,
    stunChargeOverrides,
    tacticalStrikeOverrides,
    accumulateGoldRoutines,
  ]);
};
