import { ReactNode, useEffect, useMemo, useState } from "react";
import { formatEther, Hex, parseEther } from "viem";

import { EEmpire, EShieldEaterDamageType } from "@primodiumxyz/contracts";
import { entityToAddress, formatNumber, WORLD_EVENTS_THRESHOLDS } from "@primodiumxyz/core";
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

export const EmpireSpan = ({ empireId }: { empireId: EEmpire }) => (
  <span className={EmpireEnumToConfig[empireId].textColor}>{EmpireEnumToConfig[empireId].name} empire</span>
);

export const PlanetSpan = ({ planetId }: { planetId: Entity }) => {
  const { tables, utils } = useCore();
  const planetName = tables.PlanetName.use(planetId)?.name;

  useEffect(() => {
    utils.getPlanetName(planetId);
  }, []);

  const empireId = tables.Planet.get(planetId)?.empireId;
  if (!empireId) return <span className="text-gray-400">{planetName}</span>;
  const colorClass = EmpireEnumToConfig[empireId as EEmpire].textColor;
  return <span className={colorClass}>{planetName}</span>;
};

export const PlayerSpan = ({ playerId }: { playerId: Entity | Hex }) => (
  <span className="text-yellow-400">
    <Username address={entityToAddress(playerId)} />
  </span>
);

export const useActions = (
  empireId?: EEmpire,
  options?: { filterRoutines?: boolean; laterThan?: bigint; max?: number },
): Action[] => {
  const {
    tables,
    utils: { usdToWei },
  } = useCore();
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;
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
          <p className="text-xs">
            <PlanetSpan planetId={action.planetId as Entity} /> added{" "}
            {formatNumber(action.goldAdded, { showZero: true })} iridium
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
            <PlanetSpan planetId={action.originPlanetId as Entity} /> moved{" "}
            {formatNumber(action.shipCount, { showZero: true })} ship
            {action.shipCount === 1n ? "" : "s"} to <PlanetSpan planetId={action.destinationPlanetId as Entity} />
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
            A battle on <PlanetSpan planetId={action.planetId as Entity} /> attacked{" "}
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
            <PlanetSpan planetId={action.planetId as Entity} /> bought{" "}
            {formatNumber(action.shipBought, { showZero: true })} ship
            {action.shipBought === 1n ? "" : "s"}
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
            <PlanetSpan planetId={action.planetId as Entity} /> added{" "}
            {formatNumber(action.shieldBought, { showZero: true })} shield
            {action.shieldBought === 1n ? "" : "s"}
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
            <PlayerSpan playerId={action.playerId} /> created {formatNumber(action.overrideCount, { showZero: true })}{" "}
            ship
            {action.overrideCount === 1n ? "" : "s"} on <PlanetSpan planetId={action.planetId as Entity} />
          </p>
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
          <p className="text-xs">
            <PlayerSpan playerId={action.playerId} /> charged {formatNumber(action.overrideCount, { showZero: true })}{" "}
            shield
            {action.overrideCount === 1n ? "" : "s"} on <PlanetSpan planetId={action.planetId as Entity} />
          </p>
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
          <p className="text-xs">
            <PlayerSpan playerId={action.playerId} /> placed a magnet on{" "}
            <PlanetSpan planetId={action.planetId as Entity} />
          </p>
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
          <p className="text-xs">
            <PlayerSpan playerId={action.playerId} /> detonated shield eater on{" "}
            <PlanetSpan planetId={action.planetId as Entity} />
          </p>
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
            <p className="text-xs">
              Shield eater destroyed {formatNumber(action.shieldsDestroyed, { showZero: true })} shield
              {action.shieldsDestroyed === 1n ? "" : "s"} on <PlanetSpan planetId={action.planetId as Entity} />
            </p>
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
          <p className="text-xs">
            <PlayerSpan playerId={action.playerId} /> placed acid rain on{" "}
            <PlanetSpan planetId={action.planetId as Entity} />
          </p>
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
          <p className="text-xs">
            Acid rain destroyed {formatNumber(action.shipsDestroyed, { showZero: true })} ship
            {action.shipsDestroyed === 1n ? "" : "s"} on <PlanetSpan planetId={action.planetId as Entity} />
          </p>
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
          <p className="text-xs">
            <PlayerSpan playerId={action.playerId} /> airdropped{" "}
            {formatNumber(action.goldDistributed, { showZero: true })} iridium to{" "}
            {EmpireEnumToConfig[action.empireId as EEmpire].name} empire
          </p>
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
          <p className="text-xs">
            <PlayerSpan playerId={action.playerId} /> sold{" "}
            {formatNumber(BigInt(formatEther(action.overrideCount)), { showZero: true })} point
            {action.overrideCount === parseEther("1") ? "" : "s"} from <EmpireSpan empireId={action.empireId} />
          </p>
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

    const laterThan = options?.laterThan ?? gameStartTimestamp;

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

  const [override, setOverride] = useState<(Omit<Action, "timestamp"> & { id: string; timestamp?: bigint }) | null>(
    null,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> created{" "}
              {formatNumber(current.overrideCount, { showZero: true })} ship
              {current.overrideCount === 1n ? "" : "s"} on <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> charged{" "}
              {formatNumber(current.overrideCount, { showZero: true })} shield
              {current.overrideCount === 1n ? "" : "s"} on <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> placed a magnet on{" "}
              <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> detonated shield eater on{" "}
              <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              Shield eater destroyed {formatNumber(current.shieldsDestroyed, { showZero: true })} shield
              {current.shieldsDestroyed === 1n ? "" : "s"} on <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.shieldsDestroyed >= WORLD_EVENTS_THRESHOLDS.shieldsDestroyed,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> placed acid rain on{" "}
              <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              Acid rain destroyed {formatNumber(current.shipsDestroyed, { showZero: true })} ship
              {current.shipsDestroyed === 1n ? "" : "s"} on <PlanetSpan planetId={current.planetId as Entity} />
            </p>
          ),
          highlight: current.shipsDestroyed >= WORLD_EVENTS_THRESHOLDS.shipsDestroyed,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> airdropped{" "}
              {formatNumber(current.goldDistributed, { showZero: true })} iridium to{" "}
              {EmpireEnumToConfig[current.empireId as EEmpire].name} empire
            </p>
          ),
          highlight: current.ethSpent >= ethSpentThreshold,
          timestamp: current.timestamp,
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
            <p className="text-xs">
              <PlayerSpan playerId={current.playerId} /> sold{" "}
              {formatNumber(BigInt(formatEther(current.overrideCount)), { showZero: true })} point
              {current.overrideCount === parseEther("1") ? "" : "s"} from <EmpireSpan empireId={current.empireId} />
            </p>
          ),
          highlight: current.ethReceived >= generationalWealthThreshold,
          timestamp: current.timestamp,
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
              <p>
                <EmpireSpan empireId={current.empireId as EEmpire} /> captured a citadel (
                <PlanetSpan planetId={planetId as Entity} />) from <EmpireSpan empireId={prev.empireId as EEmpire} />
              </p>
            ) : (
              <p>
                <EmpireSpan empireId={current.empireId as EEmpire} /> was first to capture the{" "}
                <PlanetSpan planetId={planetId as Entity} /> citadel
              </p>
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
                <p>
                  <EmpireSpan empireId={leadingEmpireId} /> took the lead with {leadingEmpire[1]} planets, closely
                  followed by <EmpireSpan empireId={Number(secondEmpire[0]) as EEmpire} />!
                </p>
              ) : (
                <p>
                  <EmpireSpan empireId={leadingEmpireId} /> took the lead with {leadingEmpire[1]} planets!
                </p>
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
            element: (
              <p>
                The price to support <EmpireSpan empireId={empireId as EEmpire} /> could not be lower!
              </p>
            ),
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
