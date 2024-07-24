import { ReactNode, useEffect, useMemo, useState } from "react";
import { CurrencyYenIcon, MinusIcon, PlusIcon, RocketLaunchIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { bigIntMin } from "@latticexyz/common/utils";

import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Hexagon } from "@/components/core/Hexagon";
import { Marker } from "@/components/core/Marker";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "fill-blue-600",
  [EEmpire.Green]: "fill-green-600",
  [EEmpire.Red]: "fill-red-600",
  [EEmpire.LENGTH]: "",
};

export const Planet: React.FC<{ entity: Entity; tileSize: number; margin: number }> = ({
  entity,
  tileSize,
  margin,
}) => {
  const { tables, utils } = useCore();
  const planet = tables.Planet.use(entity);
  const planetEmpire = (planet?.empireId ?? 0) as EEmpire;
  const [conquered, setConquered] = useState(false);

  const [left, top] = useMemo(() => {
    const cartesianCoord = convertAxialToCartesian(
      { q: Number(planet?.q ?? 0n), r: Number(planet?.r ?? 0n) },
      tileSize + margin,
    );

    return [cartesianCoord.x, cartesianCoord.y];
  }, [planet, tileSize, margin]);

  useEffect(() => {
    const listener = tables.BattleNPCAction.update$.subscribe(({ properties: { current } }) => {
      if (!current || current.planetId !== entity) return;
      const data = {
        planetId: current.planetId,
        deaths: bigIntMin(current.attackingShipCount, current.defendingShipCount),
        conquered: current.conquer,
      };

      // if conquered, flash the planet's stroke
      if (data.conquered) {
        setConquered(true);
        setTimeout(() => {
          setConquered(false);
        }, 5000);
      }
    });
    return () => {
      listener.unsubscribe();
    };
  }, [planet]);

  if (!planet) return null;

  return (
    <Marker id={entity} scene="MAIN" coord={{ x: left, y: top }}>
      <div className="absolute mt-14 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center gap-2 text-white">
          <div className="text-center">
            <p className="absolute left-1/2 top-4 -translate-x-1/2 transform font-mono text-xs opacity-70">
              ({(planet.q ?? 0n).toLocaleString()},{(planet.r ?? 0n).toLocaleString()})
            </p>

            <Button
              variant="ghost"
              className="font-bold"
              onClick={() => {
                tables.SelectedPlanet.set({ value: entity });
                utils.openPane("dashboard");
              }}
            >
              {entityToPlanetName(entity)}
            </Button>
          </div>
          <div className="relative flex flex-row gap-1">
            <Ships shipCount={planet.shipCount} planetId={entity} planetEmpire={planetEmpire} />
            <Shields shieldCount={planet.shieldCount} planetId={entity} planetEmpire={planetEmpire} />
          </div>
          <GoldCount goldCount={planet.goldCount} entity={entity} />
        </div>
      </div>
    </Marker>
  );
};

const GoldCount = ({ goldCount, entity }: { goldCount: bigint; entity: Entity }) => {
  const { tables } = useCore();

  const [goldFloatingTexts, setGoldFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const listener = tables.BuyShipsNPCAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.shipBought, goldSpent: current.goldSpent };
      if (data.planetId !== entity) return;

      // Add floating text
      setGoldFloatingTexts((prev) => [...prev, { id: nextId, text: `-${data.goldSpent}` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setGoldFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  return (
    <Badge variant="glass" size="lg" className="relative flex items-center gap-1 border-none bg-gray-50/20">
      <CurrencyYenIcon className="size-5" /> {goldCount.toLocaleString()}
      {goldFloatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </Badge>
  );
};

const Ships = ({
  shipCount,
  planetId,
  planetEmpire,
}: {
  shipCount: bigint;
  planetId: Entity;
  planetEmpire: EEmpire;
}) => {
  const { tables, utils } = useCore();
  const { price } = useEthPrice();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);
  const { createShip, removeShip } = useContractCalls();
  const createShipPriceWei = useActionCost(EPlayerAction.CreateShip, planetEmpire);
  const killShipPriceWei = useActionCost(EPlayerAction.KillShip, planetEmpire);
  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);

  useEffect(() => {
    const listener = tables.CreateShipPlayerAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: 1n };
      if (data.planetId !== planetId) return;

      // Add floating "+1" text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: "+1" }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  useEffect(() => {
    const listener = tables.KillShipPlayerAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: 1n };
      if (data.planetId !== planetId) return;

      // Add floating "+1" text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: <>-1</> }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  useEffect(() => {
    const listener = tables.BuyShipsNPCAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.shipBought, goldSpent: current.goldSpent };
      if (data.planetId !== planetId) return;

      // Add floating text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: `+${data.shipCount}` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  const { gameOver } = useTimeLeft();

  return (
    <div className="relative z-50 rounded-lg bg-white/20 p-1">
      <p className="flex items-center justify-center gap-2">
        <RocketLaunchIcon className="size-4" /> {shipCount.toLocaleString()}
      </p>
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text pointer-events-none absolute left-1 top-0 z-50 w-fit -translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <TransactionQueueMask id={`${planetId}-kill-ship`}>
          <Button
            tooltip={`Cost: ${killShipPriceUsd}`}
            variant="neutral"
            size="xs"
            shape="square"
            className="border-none"
            onClick={() => removeShip(planetId, killShipPriceWei)}
            disabled={gameOver || Number(planetEmpire) === 0}
          >
            <MinusIcon className="size-4" />
          </Button>
        </TransactionQueueMask>

        <TransactionQueueMask id={`${planetId}-create-ship`}>
          <Button
            tooltip={`Cost: ${createShipPriceUsd}`}
            variant="neutral"
            size="xs"
            shape="square"
            className="border-none"
            onClick={() => createShip(planetId, createShipPriceWei)}
            disabled={gameOver || Number(planetEmpire) === 0}
          >
            <PlusIcon className="size-4" />
          </Button>
        </TransactionQueueMask>
      </div>
    </div>
  );
};

const Shields = ({
  shieldCount,
  planetId,
  planetEmpire,
}: {
  shieldCount: bigint;
  planetId: Entity;
  planetEmpire: EEmpire;
}) => {
  const { utils, tables } = useCore();
  const { price } = useEthPrice();
  const calls = useContractCalls();
  const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, planetEmpire);
  const removeShieldPriceWei = useActionCost(EPlayerAction.DrainShield, planetEmpire);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const removeShieldPriceUsd = utils.weiToUsd(removeShieldPriceWei, price ?? 0);

  const { gameOver } = useTimeLeft();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string }[]>([]);
  const [nextId, setNextId] = useState(0);
  const callback = (current: any, negative?: boolean) => {
    if (!current) return;
    const data = { planetId: current.planetId, shieldCount: current.shieldCount };
    if (data.planetId !== planetId) return;

    // Add floating text
    setFloatingTexts((prev) => [...prev, { id: nextId, text: `${negative ? "-" : "+"}1` }]);
    setNextId((prev) => prev + 1);

    // Remove the floating text after 3 seconds
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
    }, 5000);
  };
  useEffect(() => {
    const listener = tables.ChargeShieldsPlayerAction.update$.subscribe(({ properties: { current } }) =>
      callback(current),
    );
    const listener2 = tables.DrainShieldsPlayerAction.update$.subscribe(({ properties: { current } }) =>
      callback(current, true),
    );

    return () => {
      listener.unsubscribe();
      listener2.unsubscribe();
    };
  }, [nextId]);
  return (
    <div className="relative z-50 rounded-lg bg-white/20 p-1">
      <p className="flex items-center justify-center gap-2">
        <ShieldCheckIcon className="size-4" /> {shieldCount.toLocaleString()}
      </p>

      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text pointer-events-none absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <TransactionQueueMask id={`${planetId}-remove-shield`}>
          <Button
            tooltip={`Cost: ${removeShieldPriceUsd}`}
            onClick={() => calls.removeShield(planetId, removeShieldPriceWei)}
            className="btn btn-square btn-xs"
            disabled={gameOver || Number(planetEmpire) === 0}
          >
            <MinusIcon className="size-4" />
          </Button>
        </TransactionQueueMask>

        <TransactionQueueMask id={`${planetId}-add-shield`}>
          <Button
            tooltip={`Cost: ${addShieldPriceUsd}`}
            onClick={() => calls.addShield(planetId, addShieldPriceWei)}
            className="btn btn-square btn-xs"
            disabled={gameOver || Number(planetEmpire) === 0}
          >
            <PlusIcon className="size-4" />
          </Button>
        </TransactionQueueMask>
      </div>
    </div>
  );
};
