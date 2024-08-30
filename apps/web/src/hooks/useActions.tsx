import { ReactNode, useEffect, useState } from "react";
import { Hex } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { entityToAddress, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Username } from "@/components/shared/Username";
import { EmpireEnumToConfig } from "@/util/lookups";

export const useActions = (
  empireId?: EEmpire,
  options?: { filterRoutines?: boolean; laterThan?: number; max?: number },
) => {
  const { tables, utils } = useCore();

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

  const [debouncedIn, setDebouncedIn] = useState(Date.now());

  useEffect(() => {
    setDebouncedIn(0);
  }, [empireId]);

  const [actions, setActions] = useState<{ timestamp: bigint; element: ReactNode; empireId: EEmpire | undefined }[]>(
    [],
  );

  const getPlanetSpan = (planetId: Entity) => {
    const planetName = tables.PlanetName.use(planetId)?.name;

    useEffect(() => {
      utils.getPlanetName(planetId);
    }, []);

    const empireId = tables.Planet.get(planetId)?.empireId;
    if (!empireId) return <span className="text-gray-400">{planetName}</span>;
    const colorClass = EmpireEnumToConfig[empireId as EEmpire].textColor;
    return <span className={colorClass}>{planetName}</span>;
  };

  const getPlayerSpan = (playerId: Entity | Hex) => (
    <span className="text-yellow-400">
      <Username address={entityToAddress(playerId)} />
    </span>
  );
  useEffect(() => {
    if (debouncedIn > Date.now()) return;
    setDebouncedIn(Date.now() + 1000);
    const accumulateGoldRoutineEntries = accumulateGoldRoutines.map((actionEntity) => {
      const action = tables.AccumulateGoldRoutineLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.goldAdded, { showZero: true })} gold
          </p>
        ),
      };
    });

    const moveRoutineEntries = moveRoutines.map((actionEntity) => {
      const action = tables.MoveRoutineLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.originPlanetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.originPlanetId as Entity)} moved {formatNumber(action.shipCount, { showZero: true })}{" "}
            ship
            {action.shipCount === 1n ? "" : "s"} to {getPlanetSpan(action.destinationPlanetId as Entity)}
          </p>
        ),
      };
    });

    const planetBattleRoutineEntries = planetBattleRoutines.map((actionEntity) => {
      const action = tables.PlanetBattleRoutineLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            A battle on {getPlanetSpan(action.planetId as Entity)} attacked{" "}
            {formatNumber(action.attackingShipCount, { showZero: true })} ship
            {action.attackingShipCount === 1n ? "" : "s"} and defended{" "}
            {formatNumber(action.defendingShipCount, { showZero: true })} ship
            {action.defendingShipCount === 1n ? "" : "s"}
          </p>
        ),
      };
    });

    const buyShipsRoutineEntries = buyShipsRoutines.map((actionEntity) => {
      const action = tables.BuyShipsRoutineLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} bought {formatNumber(action.shipBought, { showZero: true })} ship
            {action.shipBought === 1n ? "" : "s"}
          </p>
        ),
      };
    });

    const createShipOverrideEntries = createShipOverrides.map((actionEntity) => {
      const action = tables.CreateShipOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} created {formatNumber(action.overrideCount, { showZero: true })} ship
            {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const chargeShieldsOverrideEntries = chargeShieldsOverrides.map((actionEntity) => {
      const action = tables.ChargeShieldsOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} charged {formatNumber(action.overrideCount, { showZero: true })} shield
            {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
          </p>
        ),
      };
    });

    const buyShieldsRoutineEntries = buyShieldsRoutines.map((actionEntity) => {
      const action = tables.BuyShieldsRoutineLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.shieldBought, { showZero: true })}{" "}
            shield
            {action.shieldBought === 1n ? "" : "s"}
          </p>
        ),
      };
    });

    const placeMagnetOverrideEntries = placeMagnetOverrides.map((actionEntity) => {
      const action = tables.PlaceMagnetOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
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
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
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
        empireId: action.empireId,
        timestamp: action.timestamp,
        element: (
          <p className="text-xs">
            {getPlayerSpan(action.playerId)} airdropped {formatNumber(action.goldDistributed, { showZero: true })} gold
            to {EmpireEnumToConfig[action.empireId as EEmpire].name} empire
          </p>
        ),
      };
    });

    let allActions = [
      ...createShipOverrideEntries,
      ...chargeShieldsOverrideEntries,
      ...placeMagnetOverrideEntries,
      ...detonateShieldEaterOverrideEntries,
      ...airdropGoldOverrideEntries,
    ];
    if (!options?.filterRoutines) {
      allActions = [
        ...allActions,
        ...moveRoutineEntries,
        ...planetBattleRoutineEntries,
        ...buyShieldsRoutineEntries,
        ...buyShipsRoutineEntries,
        ...accumulateGoldRoutineEntries,
      ];
    }
    if (empireId) {
      allActions = allActions.filter((action) => action.empireId === empireId);
    }

    const laterThan = options?.laterThan;

    allActions.sort((a, b) => -Number(b.timestamp - a.timestamp));
    if (laterThan !== undefined) {
      allActions = allActions.filter((action) => action.timestamp > laterThan);
    }
    if (options?.max) {
      allActions = allActions.slice(-options.max);
    }
    setActions(allActions);
  }, [
    moveRoutines,
    planetBattleRoutines,
    buyShipsRoutines,
    buyShieldsRoutines,
    accumulateGoldRoutines,
    createShipOverrides,
    chargeShieldsOverrides,
    placeMagnetOverrides,
    detonateShieldEaterOverrides,
    airdropGoldOverrides,
    debouncedIn,
  ]);

  return actions;
};

export const useMostRecentOverride = () => {
  const { tables, utils } = useCore();
  const [override, setOverride] = useState<{ timestamp: bigint; element: ReactNode; empireId: EEmpire } | null>(null);
  const [actions, setActions] = useState<{ timestamp: bigint; element: ReactNode; empireId: EEmpire }[]>([]);
  const getPlanetSpan = (planetId: Entity) => {
    const planetName = tables.PlanetName.use(planetId)?.name;

    useEffect(() => {
      utils.getPlanetName(planetId);
    }, []);

    const empireId = tables.Planet.get(planetId)?.empireId;
    if (!empireId) return <span className="text-gray-400">{planetName}</span>;
    const colorClass = EmpireEnumToConfig[empireId as EEmpire].textColor;
    return <span className={colorClass}>{planetName}</span>;
  };

  const getPlayerSpan = (playerId: Entity | Hex) => (
    <span className="text-yellow-400">
      <Username address={entityToAddress(playerId)} />
    </span>
  );

  // subscribe to updates
  useEffect(() => {
    const createSub = tables.CreateShipOverrideLog.watch({
      onChange: ({ properties: { current } }) => {
        const action = current!;
        const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
        setOverride({
          empireId: empire as EEmpire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              {getPlayerSpan(action.playerId)} created {formatNumber(action.overrideCount, { showZero: true })} ship
              {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
            </div>
          ),
        });
      },
    });
    const chargeShieldsSub = tables.ChargeShieldsOverrideLog.watch({
      onChange: ({ properties: { current } }) => {
        const action = current!;
        const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
        setOverride({
          empireId: empire as EEmpire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              {getPlayerSpan(action.playerId)} charged {formatNumber(action.overrideCount, { showZero: true })} shield
              {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
            </div>
          ),
        });
      },
    });
    const placeMagnetSub = tables.PlaceMagnetOverrideLog.watch({
      onChange: ({ properties: { current } }) => {
        const action = current!;
        const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
        setOverride({
          empireId: empire as EEmpire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              {getPlayerSpan(action.playerId)} placed a magnet on {getPlanetSpan(action.planetId as Entity)}
            </div>
          ),
        });
      },
    });
    const detonateShieldEaterSub = tables.ShieldEaterDetonateOverrideLog.watch({
      onChange: ({ properties: { current } }) => {
        const action = current!;
        const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
        setOverride({
          empireId: empire as EEmpire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              {getPlayerSpan(action.playerId)} detonated shield eater on {getPlanetSpan(action.planetId as Entity)}
            </div>
          ),
        });
      },
    });
    const placeAcidSub = tables.PlaceAcidOverrideLog.watch({
      onChange: ({ properties: { current } }) => {
        const action = current!;
        const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
        setOverride({
          empireId: empire as EEmpire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              {getPlayerSpan(action.playerId)} placed acid rain on {getPlanetSpan(action.planetId as Entity)}
            </div>
          ),
        });
      },
    });
    const airdropGoldSub = tables.AirdropGoldOverrideLog.watch({
      onChange: ({ properties: { current } }) => {
        const action = current!;
        setOverride({
          empireId: action.empireId as EEmpire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              {getPlayerSpan(action.playerId)} airdropped {formatNumber(action.goldDistributed, { showZero: true })}{" "}
              gold to {EmpireEnumToConfig[action.empireId as EEmpire].name} empire
            </div>
          ),
        });
      },
    });

    return () => {
      createSub();
      chargeShieldsSub();
      placeMagnetSub();
      detonateShieldEaterSub();
      placeAcidSub();
      airdropGoldSub();
    };
  }, []);

  return override;
};
