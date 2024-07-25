import { forwardRef, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CurrencyYenIcon, RocketLaunchIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { bigIntMin } from "@latticexyz/common/utils";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Card, SecondaryCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Marker } from "@/components/core/Marker";
import { Tooltip } from "@/components/core/Tooltip";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { cn } from "@/util/client";

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
  const interactButtonRef = useRef<HTMLButtonElement>(null);

  const [left, top] = useMemo(() => {
    const cartesianCoord = convertAxialToCartesian(
      { q: Number(planet?.q ?? 0n), r: Number(planet?.r ?? 0n) },
      tileSize + margin,
    );

    return [cartesianCoord.x, cartesianCoord.y];
  }, [planet, tileSize, margin]);

  useEffect(() => {
    const listener = tables.PlanetBattleNPCAction.update$.subscribe(({ properties: { current } }) => {
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
    <Marker id={entity} scene="MAIN" coord={{ x: left, y: top }} depth={-top}>
      <div className="relative mt-14 flex flex-col items-center drop-shadow-2xl">
        <div className="group relative flex flex-col items-center">
          <div className="flex flex-row-reverse items-end rounded-box rounded-b-none border border-secondary/25 bg-gradient-to-r from-secondary/50 to-secondary/25 px-1 text-center">
            <p className="font-mono text-[10px] opacity-70">
              ({(planet.q ?? 0n).toLocaleString()},{(planet.r ?? 0n).toLocaleString()})
            </p>
            {/* dashboard button */}
            <Button
              variant="ghost"
              className="p-0 font-bold text-amber-400"
              onClick={() => {
                tables.SelectedPlanet.set({ value: entity });
                utils.openPane("dashboard");
              }}
            >
              {entityToPlanetName(entity)}
            </Button>
          </div>
          <div className="flex flex-row gap-1 rounded-box border border-secondary/25 bg-neutral/25 px-2 text-[.8em]">
            <Ships shipCount={planet.shipCount} planetId={entity} planetEmpire={planetEmpire} />
            <Shields shieldCount={planet.shieldCount} planetId={entity} planetEmpire={planetEmpire} />
            <GoldCount goldCount={planet.goldCount} entity={entity} />
          </div>

          <InteractButton
            className={cn(
              "h-full scale-75 opacity-75 transition-all group-hover:scale-100 group-hover:opacity-100",
              !planet?.empireId ? "pointer-events-none !opacity-0" : "",
            )}
            ref={interactButtonRef}
            onClick={handleInteractClick}
            isInteractPaneVisible={isInteractPaneVisible}
            planetId={entity}
            planetEmpire={planetEmpire}
          />
        </div>
      </div>
    </Marker>
  );
};

const InteractButton = forwardRef<
  HTMLButtonElement,
  {
    onClick: () => void;
    isInteractPaneVisible: boolean;
    planetId: Entity;
    planetEmpire: EEmpire;
    className: string;
  }
>(({ onClick, isInteractPaneVisible, planetId, planetEmpire, className }, ref) => {
  const InteractPaneRef = useRef<HTMLDivElement>(null);

  const { utils } = useCore();
  const { price } = useEthPrice();
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();

  const createShipPriceWei = useActionCost(EPlayerAction.CreateShip, planetEmpire);
  const killShipPriceWei = useActionCost(EPlayerAction.KillShip, planetEmpire);
  const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, planetEmpire);
  const removeShieldPriceWei = useActionCost(EPlayerAction.DrainShield, planetEmpire);

  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const removeShieldPriceUsd = utils.weiToUsd(removeShieldPriceWei, price ?? 0);

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
    <div className={cn("relative")}>
      <Button ref={ref} className={cn("p-3", className)} onClick={handleInteractClick}>
        Interact
      </Button>
      {isInteractPaneVisible && (
        <div className="absolute left-1/2 top-12 -translate-x-1/2">
          <Card
            noDecor
            ref={InteractPaneRef}
            className="flex-row items-center justify-center gap-2 bg-slate-900/85 backdrop-blur-md"
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <style>
                {`
                 input[type=number]::-webkit-inner-spin-button, 
                 input[type=number]::-webkit-outer-spin-button { 
                   opacity: 1;
                   -webkit-appearance: auto;           
                 }
              `}
              </style>
              <SecondaryCard className="grid w-96 grid-cols-7 items-center justify-center">
                <IconLabel
                  className="col-span-1 justify-center text-lg drop-shadow-lg"
                  imageUri={InterfaceIcons.Fleet}
                />
                <div className="col-span-4 flex flex-col items-start">
                  <p>Purchase Ship</p>
                  <p className="block text-xs opacity-75">Increase the number of ships</p>
                </div>
                <div className="col-span-2 flex flex-col">
                  <div className="flex flex-row justify-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={inputValue1}
                      onChange={(e) => setInputValue1(e.target.value)}
                      className="w-14 rounded bg-gray-800 text-center text-white"
                    />

                    <Button
                      className="h-7"
                      onClick={() => createShip(planetId, createShipPriceWei)}
                      disabled={gameOver || Number(planetEmpire) === 0}
                    >
                      Buy
                    </Button>
                  </div>
                  <p className="bg-sky-950/50 text-center text-xs"> Total: {createShipPriceUsd}</p>
                </div>
              </SecondaryCard>

              <SecondaryCard className="grid w-96 grid-cols-7 items-center justify-center">
                <IconLabel
                  className="col-span-1 justify-center text-lg drop-shadow-lg"
                  imageUri={InterfaceIcons.Defense}
                />
                <div className="col-span-4 flex flex-col items-start">
                  <p>Purchase Shield</p>
                  <p className="block text-xs opacity-75">Increase shield strength</p>
                </div>
                <div className="col-span-2 flex flex-col">
                  <div className="flex flex-row justify-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={inputValue2}
                      onChange={(e) => setInputValue2(e.target.value)}
                      className="w-14 rounded bg-gray-800 text-center text-white"
                    />

                    <Button
                      className="h-7"
                      onClick={() => addShield(planetId, addShieldPriceWei)}
                      disabled={gameOver || Number(planetEmpire) === 0}
                    >
                      Buy
                    </Button>
                  </div>
                  <p className="bg-sky-950/50 text-center text-xs"> Total: {addShieldPriceUsd}</p>
                </div>
              </SecondaryCard>

              <SecondaryCard className="grid w-96 grid-cols-7 items-center justify-center">
                <IconLabel
                  className="col-span-1 justify-center text-lg drop-shadow-lg"
                  imageUri={InterfaceIcons.RemoveShip}
                />
                <div className="col-span-4 flex flex-col items-start">
                  <p>Remove Ship</p>
                  <p className="block text-xs opacity-75">Reduce the number of ships</p>
                </div>
                <div className="col-span-2 flex flex-col">
                  <div className="flex flex-row justify-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={inputValue3}
                      onChange={(e) => setInputValue3(e.target.value)}
                      className="w-14 rounded bg-gray-800 text-center text-white"
                    />

                    <Button
                      className="h-7"
                      onClick={() => removeShip(planetId, killShipPriceWei)}
                      disabled={gameOver || Number(planetEmpire) === 0}
                    >
                      Buy
                    </Button>
                  </div>
                  <p className="bg-sky-950/50 text-center text-xs"> Total: {killShipPriceUsd}</p>
                </div>
              </SecondaryCard>

              <SecondaryCard className="grid w-96 grid-cols-7 items-center justify-center">
                <IconLabel
                  className="col-span-1 justify-center text-lg drop-shadow-lg"
                  imageUri={InterfaceIcons.Attack2}
                />
                <div className="col-span-4 flex flex-col items-start">
                  <p>Sabotage Shield</p>
                  <p className="block text-xs opacity-75">Decrease shield strength</p>
                </div>
                <div className="col-span-2 flex flex-col">
                  <div className="flex flex-row justify-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={inputValue4}
                      onChange={(e) => setInputValue4(e.target.value)}
                      className="w-14 rounded bg-gray-800 text-center text-white"
                    />

                    <Button
                      className="h-7"
                      onClick={() => removeShield(planetId, removeShieldPriceWei)}
                      disabled={gameOver || Number(planetEmpire) === 0}
                    >
                      Buy
                    </Button>
                  </div>
                  <p className="bg-sky-950/50 text-center text-xs"> Total: {removeShieldPriceUsd}</p>
                </div>
              </SecondaryCard>
            </div>
          </Card>
        </div>
      )}
    </div>
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
    <div className="pointer-events-auto relative z-50">
      <Tooltip tooltipContent={`GOLD`}>
        <p className="pointer-events-auto flex items-center justify-center gap-1.5">
          <IconLabel imageUri={InterfaceIcons.Vault} text={goldCount.toLocaleString()} />
        </p>
        {goldFloatingTexts.map((item) => (
          <div
            key={item.id}
            className="floating-text absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
          >
            {item.text}
          </div>
        ))}
      </Tooltip>
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

  const { gameOver } = useTimeLeft();

  const reductionPct = Number(tables.P_ActionConfig.get()?.reductionPct ?? 0n) / 10000;

  return (
    <div className="relative z-50">
      <p className="flex items-center justify-center gap-2">
        <Tooltip tooltipContent={`SHIPS`}>
          <IconLabel imageUri={InterfaceIcons.Fleet} text={shipCount.toLocaleString()} />
        </Tooltip>
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
      <p className="flex items-center justify-center">
        <Tooltip tooltipContent={`SHIELDS`}>
          <IconLabel imageUri={InterfaceIcons.Defense} text={shieldCount.toLocaleString()} />
        </Tooltip>
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
