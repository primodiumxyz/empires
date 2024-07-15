import { useEffect, useMemo, useState } from "react";
import { CurrencyYenIcon, MinusIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";
import { bigIntMin } from "@latticexyz/common/utils";

import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Hexagon } from "@/components/core/Hexagon/Hexagon";
import { Tooltip } from "@/components/core/Tooltip";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "blue",
  [EEmpire.Green]: "green",
  [EEmpire.Red]: "red",
  [EEmpire.LENGTH]: "",
};

export const Planet: React.FC<{ entity: Entity; tileSize: number; margin: number }> = ({
  entity,
  tileSize,
  margin,
}) => {
  const { tables, utils } = useCore();
  const planet = tables.Planet.use(entity);
  const calls = useContractCalls();
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

  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string }[]>([]);
  const [goldFloatingTexts, setGoldFloatingTexts] = useState<{ id: number; text: string }[]>([]);
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
      }, 3000);
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
      setFloatingTexts((prev) => [...prev, { id: nextId, text: "-1 Ship" }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 3000);
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
      }, 3000);
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
        }, 3000);
      }
    });
    return () => {
      listener.unsubscribe();
    };
  }, [planet]);

  if (!planet) return null;

  return (
    <Hexagon
      key={entity}
      fill={planet?.factionId !== 0 ? EmpireEnumToColor[planetFaction] : "grey"}
      size={tileSize}
      className="absolute -translate-x-1/2 -translate-y-1/2"
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
        <div className="relative rounded-lg bg-white/20 p-1">
          <p className="flex items-center justify-center gap-2">
            <RocketLaunchIcon className="size-4" /> {planet.destroyerCount.toLocaleString()}
          </p>

          <div className="flex items-center gap-2">
            <Tooltip tooltipContent={`Cost: ${killDestroyerPriceUsd}`}>
              <TransactionQueueMask id={`${entity}-kill-destroyer`}>
                <button
                  onClick={() => calls.removeDestroyer(entity, killDestroyerPriceWei)}
                  className="btn btn-square btn-xs"
                  disabled={gameOver || planet.factionId == 0}
                >
                  <MinusIcon className="size-4" />
                </button>
              </TransactionQueueMask>
            </Tooltip>

            <Tooltip tooltipContent={`Cost: ${createDestroyerPriceUsd}`}>
              <TransactionQueueMask id={`${entity}-create-destroyer`}>
                <button
                  onClick={() => calls.createDestroyer(entity, createDestroyerPriceWei)}
                  className="btn btn-square btn-xs"
                  disabled={gameOver || planet.factionId == 0}
                >
                  <PlusIcon className="size-4" />
                </button>
              </TransactionQueueMask>
            </Tooltip>
          </div>

          {floatingTexts.map((item) => (
            <div
              key={item.id}
              className="floating-text pointer-events-none w-full rounded bg-white p-2 text-xs text-black"
            >
              {item.text}
            </div>
          ))}
        </div>
        <div className="relative flex">
          <CurrencyYenIcon className="size-6" /> {planet.goldCount.toLocaleString()}
          {goldFloatingTexts.map((item) => (
            <div key={item.id} className="floating-text pointer-events-none w-20 rounded bg-error p-2 text-xs">
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </Hexagon>
  );
};
