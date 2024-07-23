import { forwardRef, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CurrencyYenIcon, RocketLaunchIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { bigIntMin } from "@latticexyz/common/utils";

import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { SecondaryCard, Card } from "@/components/core/Card";
import { Hexagon } from "@/components/core/Hexagon";
import { IconLabel } from "@/components/core/IconLabel";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { Sprites } from "@primodiumxyz/assets";

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
  const [isInteractPaneVisible, setIsInteractPaneVisible] = useState(false);
  const [InteractPaneStyle, setInteractPaneStyle] = useState({ top: "0px", left: "0px" });
  const interactButtonRef = useRef<HTMLButtonElement>(null);

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

  const handleInteractClick = () => {
    setIsInteractPaneVisible(!isInteractPaneVisible);
  };

  if (!planet) return null;

  return (
    <Hexagon
      key={entity}
      size={tileSize}
      className="absolute -z-10 -translate-x-1/2 -translate-y-1/2"
      fillClassName={planet?.empireId !== 0 ? EmpireEnumToColor[planetEmpire] : "fill-gray-600"}
      stroke={conquered ? "yellow" : "none"}
      style={{
        top: `${top + 50}px`,
        left: `${left}px`,
      }}
    >
      <div className="flex flex-col items-center gap-2 text-white">
        <div className="text-center">
          <p className="absolute left-1/2 top-4 -translate-x-1/2 transform font-mono text-xs opacity-70">
            ({(planet.q ?? 0n).toLocaleString()},{(planet.r ?? 0n).toLocaleString()})
          </p>
          {/* dashboard button */}
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
        <SecondaryCard className="relative flex flex-col gap-1 border-none bg-gray-50/20">
          <div className="relative flex flex-row gap-1">
            <Ships shipCount={planet.shipCount} planetId={entity} planetEmpire={planetEmpire} />
            <Shields shieldCount={planet.shieldCount} planetId={entity} planetEmpire={planetEmpire} />
            <GoldCount goldCount={planet.goldCount} entity={entity} />
          </div>
        </SecondaryCard>

        <InteractButton
          ref={interactButtonRef}
          onClick={handleInteractClick}
          isInteractPaneVisible={isInteractPaneVisible}
          InteractPaneStyle={InteractPaneStyle}
          planetId={entity}
          planetEmpire={planetEmpire}
        />
      </div>
    </Hexagon>
  );
};

const InteractButton = forwardRef<
  HTMLButtonElement,
  {
    onClick: () => void;
    isInteractPaneVisible: boolean;
    InteractPaneStyle: any;
    planetId: Entity;
    planetEmpire: EEmpire;
  }
>(({ onClick, isInteractPaneVisible, InteractPaneStyle, planetId, planetEmpire }, ref) => {
  const InteractPaneRef = useRef<HTMLDivElement>(null);

  const { utils } = useCore();
  const { price } = useEthPrice();
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const createShipPriceWei = useActionCost(EPlayerAction.CreateShip, planetEmpire);
  const killShipPriceWei = useActionCost(EPlayerAction.KillShip, planetEmpire);
  const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, planetEmpire);
  const removeShieldPriceWei = useActionCost(EPlayerAction.DrainShield, planetEmpire);
  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const removeShieldPriceUsd = utils.weiToUsd(removeShieldPriceWei, price ?? 0);

  const { gameOver } = useTimeLeft();

  const handleInteractClick = () => {
    onClick();
  };

  // Close Interact Pane
  const handleClickOutside = (event: MouseEvent) => {
    if (
      InteractPaneRef.current &&
      !InteractPaneRef.current.contains(event.target as Node) &&
      ref &&
      !(ref as React.RefObject<HTMLButtonElement>).current?.contains(event.target as Node)
    ) {
      onClick();
    }
  };

  useEffect(() => {
    if (isInteractPaneVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInteractPaneVisible]);

  // NumberInput
  const [inputValue1, setInputValue1] = useState("1");
  const [inputValue2, setInputValue2] = useState("1");
  const [inputValue3, setInputValue3] = useState("1");
  const [inputValue4, setInputValue4] = useState("1");

  return (
    <>
      <Button ref={ref} className="h-full p-3" onClick={handleInteractClick}>
        Interact
      </Button>
      {isInteractPaneVisible && (
        <Card
          noDecor
          ref={InteractPaneRef}
          className="fixed z-50 flex-row items-center justify-center gap-2 bg-slate-900/85"
          style={InteractPaneStyle}
        >

          <div className="flex flex-col items-center justify-center gap-1 pr-2">
            <style>
              {`
                 input[type=number]::-webkit-inner-spin-button, 
                 input[type=number]::-webkit-outer-spin-button { 
                   opacity: 1;
                   -webkit-appearance: auto;           
                 }
              `}
            </style>
            <SecondaryCard className="grid grid-cols-7 items-center justify-center w-96">
              <IconLabel className="col-span-1 justify-center text-lg drop-shadow-lg" imageUri={Sprites.CreateShip} />
              <div className="col-span-4 flex flex-col items-start">
                <p>Purchase Ship</p>
                <p className="block text-xs opacity-75">Increase the number of ships</p>
              </div>
              <div className="col-span-2 flex flex-col">
                <div className="flex flex-row  gap-2 justify-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={inputValue1}
                    onChange={(e) => setInputValue1(e.target.value)}
                    className="w-14 text-center bg-gray-800 text-white rounded"
                  />

                  <Button
                    className="rounded-none h-7"
                    onClick={() => createShip(planetId, createShipPriceWei)}
                    disabled={gameOver || Number(planetEmpire) === 0}>
                    Buy
                  </Button>
                </div>
                <p className="text-xs bg-sky-950/50 text-center"> Total: {createShipPriceUsd}</p>
              </div>
            </SecondaryCard>

            <SecondaryCard className="grid grid-cols-7 items-center justify-center w-96">
              <IconLabel className="col-span-1 justify-center text-lg drop-shadow-lg" imageUri={Sprites.AddShield} />
              <div className="col-span-4 flex flex-col items-start">
                <p>Acquire Shield</p>
                <p className="block text-xs opacity-75">Increase shield strength</p>
              </div>
              <div className="col-span-2 flex flex-col">
                <div className="flex flex-row gap-2 justify-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={inputValue2}
                    onChange={(e) => setInputValue2(e.target.value)}
                    className="w-14 text-center bg-gray-800 text-white rounded"
                  />

                  <Button
                    className="rounded-none h-7"
                    onClick={() => addShield(planetId, addShieldPriceWei)}
                    disabled={gameOver || Number(planetEmpire) === 0}>
                    Buy
                  </Button>
                </div>
                <p className="text-xs bg-sky-950/50 text-center"> Total: {addShieldPriceUsd}</p>
              </div>
            </SecondaryCard>

            <SecondaryCard className="grid grid-cols-7 items-center justify-center w-96">
              <IconLabel className="col-span-1 justify-center text-lg drop-shadow-lg" imageUri={Sprites.RemoveShip} />
              <div className="col-span-4 flex flex-col items-start">
                <p>Remove Ship</p>
                <p className="block text-xs opacity-75">Reduce the number of ships</p>
              </div>
              <div className="col-span-2 flex flex-col">
                <div className="flex flex-row gap-2 justify-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={inputValue3}
                    onChange={(e) => setInputValue3(e.target.value)}
                    className="w-14 text-center bg-gray-800 text-white rounded"
                  />

                  <Button
                    className="rounded-none h-7"
                    onClick={() => removeShip(planetId, killShipPriceWei)}
                      disabled={gameOver || Number(planetEmpire) === 0}>
                      Buy
                    </Button>
                  </div>
                  <p className="text-xs text-center bg-sky-950/50"> Total: {killShipPriceUsd}</p>
              </div>
            </SecondaryCard>

            <SecondaryCard className="grid grid-cols-7 items-center justify-center w-96">
              <IconLabel className="col-span-1 justify-center text-lg drop-shadow-lg" imageUri={Sprites.SabotageShield} />
              <div className="col-span-4 flex flex-col items-start">
              <p>Sabotage Shield</p>
              <p className="block text-xs opacity-75">Decrease shield strength</p>
              </div>
              <div className="col-span-2 flex flex-col">
                <div className="flex flex-row gap-2 justify-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={inputValue4}
                    onChange={(e) => setInputValue4(e.target.value)}
                    className="w-14 text-center bg-gray-800 text-white rounded"
                  />

                  <Button
                    className="rounded-none h-7"
                    onClick={() => removeShield(planetId, removeShieldPriceWei)}
                      disabled={gameOver || Number(planetEmpire) === 0}>
                      Buy
                    </Button>
                  </div>
                  <p className="text-xs text-center bg-sky-950/50"> Total: {removeShieldPriceUsd}</p>
              </div>
            </SecondaryCard>
          </div>
        </Card>
      )}
    </>
  );
});

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
    <div className="relative z-50">
      <p className="flex items-center justify-center gap-1.5">
        <CurrencyYenIcon className="size-5" /> {goldCount.toLocaleString()}
      </p>
      {goldFloatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
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
  const { tables } = useCore();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

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

  return (
    <div className="relative z-50">
      <p className="flex items-center justify-center gap-1.5">
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
  const { tables } = useCore();
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
    <div className="relative z-50">
      <p className="flex items-center justify-center gap-1.5">
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
    </div>
  );
};
