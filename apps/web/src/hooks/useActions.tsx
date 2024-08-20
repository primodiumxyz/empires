import { useMemo } from "react";
import { Address } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName, formatAddress, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { EmpireEnumToConfig } from "@/util/lookups";

export const useActions = () => {
  const { tables } = useCore();

  const moveRoutines = tables.MoveRoutineLog.useAll();
  const planetBattleRoutines = tables.PlanetBattleRoutineLog.useAll();
  const buyShipsRoutines = tables.BuyShipsRoutineLog.useAll();
  const buyShieldsRoutines = tables.BuyShieldsRoutineLog.useAll();
  const accumulateGoldRoutines = tables.AccumulateGoldRoutineLog.useAll();

  const createShipOverrides = tables.CreateShipOverrideLog.useAll();
  const chargeShieldsOverrides = tables.ChargeShieldsOverrideLog.useAll();
  const placeMagnetOverrides = tables.PlaceMagnetOverrideLog.useAll();
  const detonateShieldEaterOverrides = tables.ShieldEaterDetonateOverrideLog.useAll();
  const airdropGoldOverrides = tables.AirdropGoldOverrideLog.useAll();

  return useMemo(() => {
    const getPlanetSpan = (planetId: Entity) => {
      const empireId = tables.Planet.get(planetId)?.empireId;
      if (!empireId) return <span className="text-gray-400">{entityToPlanetName(planetId)}</span>;
      const colorClass = EmpireEnumToConfig[empireId as EEmpire].textColor;
      return <span className={colorClass}>{entityToPlanetName(planetId)}</span>;
    };

    const getPlayerSpan = (playerId: Address) => (
      <span className="text-yellow-400">{formatAddress(playerId, true)}</span>
    );

    const accumulateGoldRoutineEntries = accumulateGoldRoutines.map((actionEntity) => {
      const action = tables.AccumulateGoldRoutineLog.get(actionEntity)!;
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
      const action = tables.MoveRoutineLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.originPlanetId as Entity)} moved {formatNumber(action.shipCount)} ship
            {action.shipCount === 1n ? "" : "s"} to {getPlanetSpan(action.destinationPlanetId as Entity)}
          </p>
        ),
      };
    });

    const planetBattleRoutineEntries = planetBattleRoutines.map((actionEntity) => {
      const action = tables.PlanetBattleRoutineLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            A battle on {getPlanetSpan(action.planetId as Entity)} attacked {formatNumber(action.attackingShipCount)}{" "}
            ship{action.attackingShipCount === 1n ? "" : "s"} and defended {formatNumber(action.defendingShipCount)}{" "}
            ship{action.defendingShipCount === 1n ? "" : "s"}
          </p>
        ),
      };
    });

    const buyShipsRoutineEntries = buyShipsRoutines.map((actionEntity) => {
      const action = tables.BuyShipsRoutineLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} bought {formatNumber(action.shipBought)} ship
            {action.shipBought === 1n ? "" : "s"}
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
            {getPlayerSpan(action.playerId)} created {formatNumber(action.overrideCount)} ship
            {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
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
            {getPlayerSpan(action.playerId)} charged {formatNumber(action.overrideCount)} shield
            {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const buyShieldsRoutineEntries = buyShieldsRoutines.map((actionEntity) => {
      const action = tables.BuyShieldsRoutineLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.shieldBought)} shield
            {action.shieldBought === 1n ? "" : "s"}
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
    const detonateShieldEaterOverrideEntries = detonateShieldEaterOverrides.map((actionEntity) => {
      const action = tables.ShieldEaterDetonateOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} detonated shield eater on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });
    const airdropGoldOverrideEntries = airdropGoldOverrides.map((actionEntity) => {
      const action = tables.AirdropGoldOverrideLog.get(actionEntity)!;
      return {
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} airdropped {formatNumber(action.goldDistributed)} gold to{" "}
            {EmpireEnumToConfig[action.empireId as EEmpire].name} empire
          </p>
        ),
      };
    });

    const allActions = [
      ...moveRoutineEntries,
      ...planetBattleRoutineEntries,
      ...buyShipsRoutineEntries,
      ...createShipOverrideEntries,
      ...chargeShieldsOverrideEntries,
      ...buyShieldsRoutineEntries,
      ...placeMagnetOverrideEntries,
      ...detonateShieldEaterOverrideEntries,
      ...accumulateGoldRoutineEntries,
      ...airdropGoldOverrideEntries,
    ];
    allActions.sort((a, b) => -Number(b.timestamp - a.timestamp));
    return allActions;
  }, [
    moveRoutines,
    planetBattleRoutines,
    buyShipsRoutines,
    createShipOverrides,
    chargeShieldsOverrides,
    buyShieldsRoutines,
    placeMagnetOverrides,
    detonateShieldEaterOverrides,
    accumulateGoldRoutines,
    airdropGoldOverrides,
  ]);
};
