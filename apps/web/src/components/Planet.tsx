import { useMemo } from "react";
import { CurrencyYenIcon, MinusIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";

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

  if (!planet) return null;

  return (
    <Hexagon
      key={entity}
      fill={planet?.factionId !== 0 ? EmpireEnumToColor[planetFaction] : "grey"}
      size={tileSize}
      className="absolute -translate-x-1/2 -translate-y-1/2"
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
        <div className="rounded-lg bg-white/20 p-1">
          <p className="flex items-center justify-center gap-2">
            <RocketLaunchIcon className="size-4" /> {planet.destroyerCount.toLocaleString()}
          </p>

          <div className="flex items-center gap-2">
            <Tooltip tooltipContent={`Cost: ${createDestroyerPriceUsd}`}>
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

            <Tooltip tooltipContent={`Cost: ${killDestroyerPriceUsd}`}>
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
        </div>
        <div className="flex">
          <CurrencyYenIcon className="size-6" /> {planet.goldCount.toLocaleString()}
        </div>
      </div>
    </Hexagon>
  );
};
