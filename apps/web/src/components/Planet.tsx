import { ReactNode, useEffect, useMemo, useState, useRef } from "react";
import { CurrencyYenIcon, MinusIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
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
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";

import { IconLabel } from "@/components/core/IconLabel";
import { NumberInput } from "@/components/core/NumberInput";
import shipIcon from '../assets/art sprites/UI_Ship.png';
import defenseIcon from '../assets/art sprites/UI_Defense.png';
import sabotageIcon from '../assets/art sprites/UI_Attack.png';

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
  const { createDestroyer, removeDestroyer } = useContractCalls();
  const planetFaction = (planet?.factionId ?? 0) as EEmpire;
  const [conquered, setConquered] = useState(false);

  const { price } = useEthPrice();
  const { gameOver } = useTimeLeft();

  const [left, top] = useMemo(() => {
    const cartesianCoord = convertAxialToCartesian(
      { q: Number(planet?.q ?? 0n), r: Number(planet?.r ?? 0n) },
      tileSize + margin,
    );

    return [cartesianCoord.x, cartesianCoord.y];
  }, [planet, tileSize, margin]);

  const createDestroyerPriceWei = useActionCost(EPlayerAction.CreateDestroyer, planetFaction);
  const killDestroyerPriceWei = useActionCost(EPlayerAction.KillDestroyer, planetFaction);

  const createDestroyerPriceUsd = utils.ethToUSD(createDestroyerPriceWei, price ?? 0);
  const killDestroyerPriceUsd = utils.ethToUSD(killDestroyerPriceWei, price ?? 0);

  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [goldFloatingTexts, setGoldFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const listener = tables.CreateDestroyerPlayerAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: 1n };
      console.log({ planetId: data.planetId, entity });
      if (data.planetId !== entity) return;

      // Add floating "+1" text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: "+1 Ship" }]);
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
    const listener = tables.KillDestroyerPlayerAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: 1n };
      console.log({ planetId: data.planetId, entity });
      if (data.planetId !== entity) return;

      // Add floating "+1" text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: <>-1 Ship</> }]);
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
    const listener = tables.BuyDestroyersNPCAction.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.destroyerBought, goldSpent: current.goldSpent };
      if (data.planetId !== entity) return;

      // Add floating text
      setGoldFloatingTexts((prev) => [...prev, { id: nextId, text: `-${data.goldSpent} Gold` }]);
      setFloatingTexts((prev) => [...prev, { id: nextId, text: `+${data.shipCount} Ship(s)` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
        setGoldFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

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

  // NumberInput 
  const [inputValue, setInputValue] = useState("0");

  //leftDiv Interact Pane
  const [leftDivContent, setLeftDivContent] = useState({
    title: "Buy Ship",
    icon: shipIcon,
    price: createDestroyerPriceUsd,
    buttonAction: () => createDestroyer(entity, createDestroyerPriceWei),
  });

  useEffect(() => {
    setInputValue("0");
  }, [leftDivContent]);

  // Interact Pane
  const [isSecondaryCardVisible, setIsSecondaryCardVisible] = useState(false);
  const handleInteractClick = () => {
    setIsSecondaryCardVisible(!isSecondaryCardVisible);
  };

  const interactButtonRef = useRef<HTMLButtonElement>(null);
  const [secondaryCardStyle, setSecondaryCardStyle] = useState({ top: '0px', left: '0px' });

  useEffect(() => {
    const updateSecondaryCardPosition = () => {
      if (interactButtonRef.current) {
        const buttonRect = interactButtonRef.current.getBoundingClientRect();
        setSecondaryCardStyle({
          top: `${buttonRect.top + buttonRect.height + window.scrollY - 20}px`,
          left: `${buttonRect.left + window.scrollX + 70}px`,
        });
      }
    };

    updateSecondaryCardPosition();
    window.addEventListener('resize', updateSecondaryCardPosition);

    return () => {
      window.removeEventListener('resize', updateSecondaryCardPosition);
    };
  }, [isSecondaryCardVisible]);
  if (!planet) return null;

  return (
    <>
      <Hexagon
        key={entity}
        size={tileSize}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
        fillClassName={planet?.factionId !== 0 ? EmpireEnumToColor[planetFaction] : "fill-gray-600"}
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
            <p className="font-bold">{entityToPlanetName(entity)}</p>
          </div>

          <SecondaryCard className="relative flex flex-col gap-1 border-none bg-gray-50/20">
            <p className="flex items-center justify-center gap-2">
              <RocketLaunchIcon className="size-4" /> {planet.destroyerCount.toLocaleString()}
              <CurrencyYenIcon className="size-5" /> {planet.goldCount.toLocaleString()}
            </p>
            {floatingTexts.map((item) => (
              <div
                key={item.id}
                className="floating-text pointer-events-none w-fit rounded bg-white p-2 text-xs text-black"
              >
                {item.text}
              </div>
            ))}
            {goldFloatingTexts.map((item) => (
              <div
                key={item.id}
                className="floating-text pointer-events-none w-fit rounded bg-white p-2 text-xs text-black"
              >
                {item.text}
              </div>
            ))}
          </SecondaryCard>

          <Button ref={interactButtonRef} className="p-3 h-full" onClick={handleInteractClick}>
            Interact
          </Button>
        </div>
      </Hexagon>
      {isSecondaryCardVisible && (
        <SecondaryCard className="flex-row gap-2 items-center justify-center fixed z-50 bg-slate-900/85"
          style={secondaryCardStyle}>

          {/* left */}
          <div className="flex flex-col items-center justify-center gap-1 h-52">
            <p className="pb-3">{leftDivContent.title}</p>
            <IconLabel className="text-lg drop-shadow-lg" imageUri={leftDivContent.icon} />
            <p>{leftDivContent.price}</p>
            <NumberInput
              count={inputValue}
              min={0}
              onChange={setInputValue}
              toFixed={4}
            />
            <Button onClick={leftDivContent.buttonAction} disabled={gameOver || planet.factionId === 0}>
              Buy
            </Button>
          </div>

          {/* right */}
          <div className="flex flex-col gap-1 items-center justify-center pr-2">
            <Button
              size="content"
              variant="neutral"
              onClick={() => createDestroyer(entity, createDestroyerPriceWei)}
              disabled={gameOver || planet.factionId == 0}
              onMouseEnter={() => setLeftDivContent({
                title: "Buy Ship",
                icon: shipIcon,
                price: createDestroyerPriceUsd,
                buttonAction: () => createDestroyer(entity, createDestroyerPriceWei)
              })}
            >
              <div className="flex flex-start px-1 gap-3 w-60">
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
              // onClick={}
              disabled={gameOver || planet.factionId == 0}
              onMouseEnter={() => setLeftDivContent({
                title: "Buy Shield",
                icon: defenseIcon,
                price: createDestroyerPriceUsd,
                buttonAction: () => createDestroyer(entity, createDestroyerPriceWei)
              })}
            >
              <div className="flex flex-start px-1 gap-3 w-60">
                <IconLabel className="text-lg drop-shadow-lg" imageUri={defenseIcon} />
                <div className="flex flex-col items-start">
                  <p>Buy Shield</p>
                  <p className="block text-xs opacity-75">Description of buy shield</p>
                </div>
              </div>
            </Button>

            <Button
              size="content"
              variant="neutral"
              onClick={() => removeDestroyer(entity, killDestroyerPriceWei)}
              disabled={gameOver || planet.factionId == 0}
              onMouseEnter={() => setLeftDivContent({
                title: "Sabotage",
                icon: sabotageIcon,
                price: killDestroyerPriceUsd,
                buttonAction: () => removeDestroyer(entity, killDestroyerPriceWei)
              })}
            >
              <div className="flex flex-start px-1 gap-3 w-60">
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
};
