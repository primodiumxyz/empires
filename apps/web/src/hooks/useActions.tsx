import { ReactNode, useEffect, useMemo, useState } from "react";
import { Address, Hex } from "viem";

import { EEmpire, EShieldEaterDamageType } from "@primodiumxyz/contracts";
import { entityToAddress, entityToPlanetName, formatNumber, WORLD_EVENTS_THRESHOLDS } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { decodeEntity } from "@primodiumxyz/reactive-tables/utils";
import { Username } from "@/components/shared/Username";
import { useEthPrice } from "@/hooks/useEthPrice";
import { EmpireEnumToConfig } from "@/util/lookups";

type Action = {
  timestamp: bigint;
  element: ReactNode;
  empireId: EEmpire | undefined;
  highlight?: boolean;
};

export const useActions = (
  empireId?: EEmpire,
  options?: { filterRoutines?: boolean; laterThan?: number; max?: number },
): Action[] => {
  const {
    tables,
    utils: { usdToWei },
  } = useCore();
  const { price } = useEthPrice();
  const ethSpentThreshold = useMemo(() => usdToWei(WORLD_EVENTS_THRESHOLDS.dollarSpent, price ?? 0), [price]);
  const generationalWealthThreshold = useMemo(
    () => usdToWei(WORLD_EVENTS_THRESHOLDS.generationalWealth, price ?? 0),
    [price],
  );

  const moveRoutines = tables.MoveRoutineLog.useAll();
  const planetBattleRoutines = tables.PlanetBattleRoutineLog.useAll();
  const buyShipsRoutines = tables.BuyShipsRoutineLog.useAll();
  const buyShieldsRoutines = tables.BuyShieldsRoutineLog.useAll();
  const accumulateGoldRoutines = tables.AccumulateGoldRoutineLog.useAll();

  const createShipOverrides = tables.CreateShipOverrideLog.useAll();
  const chargeShieldsOverrides = tables.ChargeShieldsOverrideLog.useAll();
  const placeMagnetOverrides = tables.PlaceMagnetOverrideLog.useAll();
  const detonateShieldEaterOverrides = tables.ShieldEaterDetonateOverrideLog.useAll();
  const detonateShieldEaterDamageImpact = tables.ShieldEaterDamageOverrideLog.useAll();
  const placeAcidOverrides = tables.PlaceAcidOverrideLog.useAll();
  const acidDamageImpact = tables.AcidDamageOverrideLog.useAll();
  const airdropGoldOverrides = tables.AirdropGoldOverrideLog.useAll();
  const sellPointsOverrides = tables.SellPointsOverrideLog.useAll();

  const [debouncedIn, setDebouncedIn] = useState(Date.now());
  const [actions, setActions] = useState<Action[]>([]);

  const getPlanetSpan = (planetId: Entity) => {
    const empireId = tables.Planet.get(planetId)?.empireId;
    if (!empireId) return <span className="text-gray-400">{entityToPlanetName(planetId)}</span>;
    return <span className={EmpireEnumToConfig[empireId as EEmpire].textColor}>{entityToPlanetName(planetId)}</span>;
  };

  const getPlayerSpan = (playerId: Entity | Hex) => (
    <span className="text-yellow-400">
      <Username address={entityToAddress(playerId)} />
    </span>
  );

  useEffect(() => {
    setDebouncedIn(0);
  }, [empireId]);

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
          <div className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.goldAdded, { showZero: true })} gold
          </div>
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
          <div className="text-xs">
            {getPlanetSpan(action.originPlanetId as Entity)} moved {formatNumber(action.shipCount, { showZero: true })}{" "}
            ship
            {action.shipCount === 1n ? "" : "s"} to {getPlanetSpan(action.destinationPlanetId as Entity)}
          </div>
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
          <div className="text-xs">
            A battle on {getPlanetSpan(action.planetId as Entity)} attacked{" "}
            {formatNumber(action.attackingShipCount, { showZero: true })} ship
            {action.attackingShipCount === 1n ? "" : "s"} and defended{" "}
            {formatNumber(action.defendingShipCount, { showZero: true })} ship
            {action.defendingShipCount === 1n ? "" : "s"}
          </div>
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
          <div className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} bought {formatNumber(action.shipBought, { showZero: true })} ship
            {action.shipBought === 1n ? "" : "s"}
          </div>
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
          <div className="text-xs">
            {getPlanetSpan(action.planetId as Entity)} added {formatNumber(action.shieldBought, { showZero: true })}{" "}
            shield
            {action.shieldBought === 1n ? "" : "s"}
          </div>
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
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} created {formatNumber(action.overrideCount, { showZero: true })} ship
            {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
          </div>
        ),
        highlight: action.ethSpent >= ethSpentThreshold,
      };
    });

    const chargeShieldsOverrideEntries = chargeShieldsOverrides.map((actionEntity) => {
      const action = tables.ChargeShieldsOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} charged {formatNumber(action.overrideCount, { showZero: true })} shield
            {action.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
          </div>
        ),
        highlight: action.ethSpent >= ethSpentThreshold,
      };
    });

    const placeMagnetOverrideEntries = placeMagnetOverrides.map((actionEntity) => {
      const action = tables.PlaceMagnetOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} placed a magnet on {getPlanetSpan(action.planetId as Entity)}
          </div>
        ),
        highlight: action.ethSpent >= ethSpentThreshold,
      };
    });

    const detonateShieldEaterOverrideEntries = detonateShieldEaterOverrides.map((actionEntity) => {
      const action = tables.ShieldEaterDetonateOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} detonated shield eater on {getPlanetSpan(action.planetId as Entity)}
          </div>
        ),
        highlight: action.ethSpent >= ethSpentThreshold,
      };
    });

    const shieldEaterDamageImpactEntries = detonateShieldEaterDamageImpact
      .map((actionEntity) => {
        const action = tables.ShieldEaterDamageOverrideLog.get(actionEntity)!;
        if (action.damageType === EShieldEaterDamageType.Eat) return;
        const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
        return {
          empireId: empire,
          timestamp: action.timestamp,
          element: (
            <div className="text-xs">
              Shield eater destroyed {formatNumber(action.shieldsDestroyed, { showZero: true })} shield
              {action.shieldsDestroyed === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
            </div>
          ),
          highlight: action.shieldsDestroyed >= WORLD_EVENTS_THRESHOLDS.shieldsDestroyed,
        };
      })
      .filter((action) => action !== undefined);

    const placeAcidOverrideEntries = placeAcidOverrides.map((actionEntity) => {
      const action = tables.PlaceAcidOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} placed acid rain on {getPlanetSpan(action.planetId as Entity)}
          </div>
        ),
        highlight: action.ethSpent >= ethSpentThreshold,
      };
    });

    const acidDamageImpactEntries = acidDamageImpact.map((actionEntity) => {
      const action = tables.AcidDamageOverrideLog.get(actionEntity)!;
      const empire = tables.Planet.get(action.planetId as Entity)?.empireId;
      return {
        empireId: empire,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            Acid rain destroyed {formatNumber(action.shipsDestroyed, { showZero: true })} ship
            {action.shipsDestroyed === 1n ? "" : "s"} on {getPlanetSpan(action.planetId as Entity)}
          </div>
        ),
        highlight: action.shipsDestroyed >= WORLD_EVENTS_THRESHOLDS.shipsDestroyed,
      };
    });

    const airdropGoldOverrideEntries = airdropGoldOverrides.map((actionEntity) => {
      const action = tables.AirdropGoldOverrideLog.get(actionEntity)!;
      return {
        empireId: action.empireId,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} airdropped {formatNumber(action.goldDistributed, { showZero: true })} gold
            to {EmpireEnumToConfig[action.empireId as EEmpire].name} empire
          </div>
        ),
        highlight: action.ethSpent >= ethSpentThreshold,
      };
    });

    const sellPointsOverrideEntries = sellPointsOverrides.map((actionEntity) => {
      const action = tables.SellPointsOverrideLog.get(actionEntity)!;
      return {
        empireId: action.empireId,
        timestamp: action.timestamp,
        element: (
          <div className="text-xs">
            {getPlayerSpan(action.playerId)} sold {formatNumber(action.overrideCount, { showZero: true })} points
          </div>
        ),
        highlight: action.ethReceived >= generationalWealthThreshold,
      };
    });

    let allActions = [
      ...createShipOverrideEntries,
      ...chargeShieldsOverrideEntries,
      ...placeMagnetOverrideEntries,
      ...detonateShieldEaterOverrideEntries,
      ...shieldEaterDamageImpactEntries,
      ...placeAcidOverrideEntries,
      ...acidDamageImpactEntries,
      ...airdropGoldOverrideEntries,
      ...sellPointsOverrideEntries,
    ] as Action[];
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

    allActions.sort((a, b) => -Number(b.timestamp - (a.timestamp ?? 0n)));
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
  const {
    tables,
    utils: { usdToWei },
  } = useCore();
  const { price } = useEthPrice();
  const ethSpentThreshold = useMemo(() => usdToWei(WORLD_EVENTS_THRESHOLDS.dollarSpent, price ?? 0), [price]);
  const generationalWealthThreshold = useMemo(
    () => usdToWei(WORLD_EVENTS_THRESHOLDS.generationalWealth, price ?? 0),
    [price],
  );

  const [override, setOverride] = useState<(Omit<Action, "timestamp"> & { id: string }) | null>(null);

  const getEmpireSpan = (empireId: EEmpire) => (
    <span className={EmpireEnumToConfig[empireId].textColor}>{EmpireEnumToConfig[empireId].name} empire</span>
  );

  const getPlanetSpan = (planetId: Entity) => {
    const empireId = tables.Planet.get(planetId)?.empireId;
    if (!empireId) return <span className="text-gray-400">{entityToPlanetName(planetId)}</span>;
    return <span className={EmpireEnumToConfig[empireId as EEmpire].textColor}>{entityToPlanetName(planetId)}</span>;
  };

  const getPlayerSpan = (playerId: Address) => (
    <span className="text-yellow-400">
      <Username address={entityToAddress(playerId)} />
    </span>
  );

  // subscribe to updates
  useEffect(() => {
    const createShipsUnsub = tables.CreateShipOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} created {formatNumber(current.overrideCount, { showZero: true })} ship
              {current.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
        });
      },
    });

    const chargeShieldsUnsub = tables.ChargeShieldsOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} charged {formatNumber(current.overrideCount, { showZero: true })} shield
              {current.overrideCount === 1n ? "" : "s"} on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
        });
      },
    });

    const placeMagnetUnsub = tables.PlaceMagnetOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} placed a magnet on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
        });
      },
    });

    const detonateShieldEaterUnsub = tables.ShieldEaterDetonateOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} detonated shield eater on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
        });
      },
    });

    const shieldEaterDamageImpactUnsub = tables.ShieldEaterDamageOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        if (current.damageType === EShieldEaterDamageType.Eat) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              Shield eater destroyed {formatNumber(current.shieldsDestroyed, { showZero: true })} shield
              {current.shieldsDestroyed === 1n ? "" : "s"} on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.shieldsDestroyed >= WORLD_EVENTS_THRESHOLDS.shieldsDestroyed,
        });
      },
    });

    const placeAcidUnsub = tables.PlaceAcidOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} placed acid rain on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
        });
      },
    });

    const acidDamageImpactUnsub = tables.AcidDamageOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        const empire = tables.Planet.get(current.planetId as Entity)?.empireId;
        setOverride({
          id: entity,
          empireId: empire as EEmpire,
          element: (
            <div className="text-xs">
              Acid rain destroyed {formatNumber(current.shipsDestroyed, { showZero: true })} ship
              {current.shipsDestroyed === 1n ? "" : "s"} on {getPlanetSpan(current.planetId as Entity)}
            </div>
          ),
          highlight: current.shipsDestroyed >= WORLD_EVENTS_THRESHOLDS.shipsDestroyed,
        });
      },
    });

    const airdropGoldUnsub = tables.AirdropGoldOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        setOverride({
          id: entity,
          empireId: current.empireId as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} airdropped {formatNumber(current.goldDistributed, { showZero: true })}{" "}
              gold to {EmpireEnumToConfig[current.empireId as EEmpire].name} empire
            </div>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
        });
      },
    });

    const sellPointsUnsub = tables.SellPointsOverrideLog.watch({
      onChange: ({ entity, properties: { current } }) => {
        if (!current) return;
        setOverride({
          id: entity,
          empireId: current.empireId as EEmpire,
          element: (
            <div className="text-xs">
              {getPlayerSpan(current.playerId)} sold {formatNumber(current.overrideCount, { showZero: true })} point
              {current.overrideCount === 1n ? "" : "s"}
            </div>
          ),
          highlight: current.ethReceived >= generationalWealthThreshold,
        });
      },
    });

    const capturesUnsub = tables.Planet.watch({
      onChange: ({ entity, properties: { current, prev } }) => {
        if (!current || !prev || current.empireId === prev.empireId) return;
        const { id: planetId } = decodeEntity(tables.Planet.metadata.abiKeySchema, entity);
        const prevEmpire = prev.empireId ? EmpireEnumToConfig[prev.empireId as EEmpire].name : undefined;

        // - a citadel being captured/changing ownership
        if (current.isCitadel) {
          setOverride({
            id: `${entity}-citadel`,
            empireId: current.empireId as EEmpire,
            element: prevEmpire ? (
              <div>
                {getEmpireSpan(current.empireId as EEmpire)} captured a citadel ({getPlanetSpan(planetId as Entity)})
                from {getEmpireSpan(prev.empireId as EEmpire)}
              </div>
            ) : (
              <div>
                {getEmpireSpan(current.empireId as EEmpire)} was first to capture the{" "}
                {getPlanetSpan(planetId as Entity)} citadel
              </div>
            ),
          });
        }

        // - an empire just took the lead in planet count
        // count the number of planets each empire has
        const allPlanets = tables.Planet.getAll().map((entity) => tables.Planet.get(entity));
        const planetCounts = allPlanets.reduce(
          (acc, planet) => {
            const empireId = planet?.empireId as EEmpire;
            if (!empireId) return acc;
            acc[empireId] = (acc[empireId] || 0) + 1;
            return acc;
          },
          {} as Record<EEmpire, number>,
        );

        // grab the two leading empires
        const sortedEmpires = Object.entries(planetCounts).sort((a, b) => b[1] - a[1]);
        const [leadingEmpire, secondEmpire, thirdEmpire] = sortedEmpires;

        const leadingEmpireId = leadingEmpire ? (Number(leadingEmpire[0]) as EEmpire) : undefined;
        // we're only interested if:
        if (
          leadingEmpire &&
          secondEmpire &&
          // a. the difference between them is 1 planet (otherwise this is not the update we're looking for)
          leadingEmpire[1] - secondEmpire[1] === 1 &&
          // b. the leading empire just captured this planet (meaning this is the actual leadership change)
          current.empireId === leadingEmpireId &&
          prev.empireId !== leadingEmpireId
        ) {
          setOverride({
            id: `${entity}-planetCount`,
            empireId: leadingEmpireId as EEmpire,
            element:
              thirdEmpire && secondEmpire[1] !== thirdEmpire[1] ? (
                <div>
                  {getEmpireSpan(leadingEmpireId)} took the lead with {leadingEmpire[1]} planets, closely followed by{" "}
                  {getEmpireSpan(Number(secondEmpire[0]) as EEmpire)}!
                </div>
              ) : (
                <div>
                  {getEmpireSpan(leadingEmpireId)} took the lead with {leadingEmpire[1]} planets!
                </div>
              ),
          });
        }
      },
    });

    const pointsCheapUnsub = tables.Empire.watch({
      onChange: ({ entity, properties: { current, prev } }) => {
        const config = tables.P_PointConfig.get();
        if (!current || !prev || !config) return;

        if (current.pointCost <= config.minPointCost && prev.pointCost > config.minPointCost) {
          const { id: empireId } = decodeEntity(tables.Empire.metadata.abiKeySchema, entity);
          setOverride({
            id: entity,
            empireId: empireId as EEmpire,
            element: <div>The price to support {getEmpireSpan(empireId as EEmpire)} could not be lower!</div>,
          });
        }
      },
    });

    return () => {
      createShipsUnsub();
      chargeShieldsUnsub();
      placeMagnetUnsub();
      detonateShieldEaterUnsub();
      shieldEaterDamageImpactUnsub();
      placeAcidUnsub();
      acidDamageImpactUnsub();
      airdropGoldUnsub();
      sellPointsUnsub();
      capturesUnsub();
      pointsCheapUnsub();
    };
  }, []);

  return override;
};
