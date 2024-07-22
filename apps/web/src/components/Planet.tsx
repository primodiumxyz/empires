import { forwardRef, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { CurrencyYenIcon, MinusIcon, PlusIcon, RocketLaunchIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { bigIntMin } from "@latticexyz/common/utils";

import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Hexagon } from "@/components/core/Hexagon";
import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";

import sabotageIcon from "../assets/art sprites/UI_Attack.png";
import shieldIcon from "../assets/art sprites/UI_Defense.png";
import shipIcon from "../assets/art sprites/UI_Ship.png";

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
  const [isSecondaryCardVisible, setIsSecondaryCardVisible] = useState(false);
  const [secondaryCardStyle, setSecondaryCardStyle] = useState({ top: "0px", left: "0px" });
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
    setIsSecondaryCardVisible(!isSecondaryCardVisible);
  };

  useEffect(() => {
    const updateSecondaryCardPosition = () => {
      const buttonRect = document.querySelector(".p-3.h-full")?.getBoundingClientRect();
      if (buttonRect) {
        setSecondaryCardStyle({
          top: `${buttonRect.top + buttonRect.height + window.scrollY - 175}px`,
          left: `${buttonRect.left + window.scrollX - 790}px`,
        });
      }
    };

    // useEffect(() => {
    //   const updateSecondaryCardPosition = () => {
    //     if (interactButtonRef.current) {
    //       const buttonRect = interactButtonRef.current.getBoundingClientRect();
    //       setSecondaryCardStyle({
    //         top: `${buttonRect.top + buttonRect.height + window.scrollY-200}px`,
    //         left: `${buttonRect.left + window.scrollX - 600}px`,
    //       });
    //     }
    //   };
    updateSecondaryCardPosition();
    window.addEventListener("resize", updateSecondaryCardPosition);

    return () => {
      window.removeEventListener("resize", updateSecondaryCardPosition);
    };
  }, [isSecondaryCardVisible]);

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
          isSecondaryCardVisible={isSecondaryCardVisible}
          secondaryCardStyle={secondaryCardStyle}
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
    isSecondaryCardVisible: boolean;
    secondaryCardStyle: any;
    planetId: Entity;
    planetEmpire: EEmpire;
  }
>(({ onClick, isSecondaryCardVisible, secondaryCardStyle, planetId, planetEmpire }, ref) => {
  const secondaryCardRef = useRef<HTMLDivElement>(null);

  const { utils } = useCore();
  const { price } = useEthPrice();
  const { createShip, removeShip, addShield } = useContractCalls();
  const createShipPriceWei = useActionCost(EPlayerAction.CreateShip, planetEmpire);
  const killShipPriceWei = useActionCost(EPlayerAction.KillShip, planetEmpire);
  const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, planetEmpire);
  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const { gameOver } = useTimeLeft();

  const handleInteractClick = () => {
    onClick();
  };

  // Close Interact Pane
  const handleClickOutside = (event: MouseEvent) => {
    if (
      secondaryCardRef.current &&
      !secondaryCardRef.current.contains(event.target as Node) &&
      ref &&
      !(ref as React.RefObject<HTMLButtonElement>).current?.contains(event.target as Node)
    ) {
      onClick();
    }
  };

  useEffect(() => {
    if (isSecondaryCardVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSecondaryCardVisible]);

  // NumberInput
  const [inputValue, setInputValue] = useState("0");

  //leftDiv Interact Pane
  const [leftDivContent, setLeftDivContent] = useState({
    title: "Buy Ship",
    icon: shipIcon,
    price: createShipPriceUsd,
    buttonAction: () => createShip(planetId, createShipPriceWei),
  });

  useEffect(() => {
    setInputValue("0");
  }, [leftDivContent]);

  return (
    <>
      <Button ref={ref} className="h-full p-3" onClick={handleInteractClick}>
        Interact
      </Button>
      {isSecondaryCardVisible && (
        <SecondaryCard
          ref={secondaryCardRef}
          className="fixed z-50 flex-row items-center justify-center gap-2 bg-slate-900/85"
          style={secondaryCardStyle}
        >
          {/* Left */}
          <div className="flex h-52 flex-col items-center justify-center gap-1">
            <p className="pb-3">{leftDivContent.title}</p>
            <IconLabel className="text-lg drop-shadow-lg" imageUri={leftDivContent.icon} />
            <p>{leftDivContent.price}</p>
            <NumberInput count={inputValue} min={0} onChange={setInputValue} toFixed={4} />
            <Button onClick={leftDivContent.buttonAction} disabled={gameOver || Number(planetEmpire) === 0}>
              Buy
            </Button>
          </div>

          {/* Right */}
          <div className="flex flex-col items-center justify-center gap-1 pr-2">
            <Button
              size="content"
              variant="neutral"
              onClick={() => createShip(planetId, createShipPriceWei)}
              disabled={gameOver || Number(planetEmpire) === 0}
              onMouseEnter={() =>
                setLeftDivContent({
                  title: "Buy Ship",
                  icon: shipIcon,
                  price: createShipPriceUsd,
                  buttonAction: () => createShip(planetId, createShipPriceWei),
                })
              }
            >
              <div className="flex-start flex w-60 gap-3 px-1">
                <IconLabel className="text-lg drop-shadow-lg" imageUri={shipIcon} />
                <div className="flex flex-col items-start">
                  <p>Buy Ship</p>
                  <p className="block text-xs opacity-75">Description of buy ship</p>
                </div>
              </div>
            </Button>

            <Button
              size="content"
              variant="neutral"
              onClick={() => addShield(planetId, addShieldPriceWei)}
              disabled={gameOver || Number(planetEmpire) === 0}
              onMouseEnter={() =>
                setLeftDivContent({
                  title: "Buy Shield",
                  icon: shieldIcon,
                  price: addShieldPriceUsd,
                  buttonAction: () => addShield(planetId, addShieldPriceWei),
                })
              }
            >
              <div className="flex-start flex w-60 gap-3 px-1">
                <IconLabel className="text-lg drop-shadow-lg" imageUri={shieldIcon} />
                <div className="flex flex-col items-start">
                  <p>Buy Shield</p>
                  <p className="block text-xs opacity-75">Description of buy shield</p>
                </div>
              </div>
            </Button>

            <Button
              size="content"
              variant="neutral"
              onClick={() => removeShip(planetId, killShipPriceWei)}
              disabled={gameOver || Number(planetEmpire) === 0}
              onMouseEnter={() =>
                setLeftDivContent({
                  title: "Sabotage",
                  icon: sabotageIcon,
                  price: killShipPriceUsd,
                  buttonAction: () => removeShip(planetId, killShipPriceWei),
                })
              }
            >
              <div className="flex-start flex w-60 gap-3 px-1">
                <IconLabel className="text-lg drop-shadow-lg" imageUri={sabotageIcon} />
                <div className="flex flex-col items-start">
                  <p>Sabotage</p>
                  <p className="block text-xs opacity-75">Description of sabotage</p>
                </div>
              </div>
            </Button>
          </div>
        </SecondaryCard>
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
