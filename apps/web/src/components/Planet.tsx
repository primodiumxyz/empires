import { useMemo } from "react";
import { CurrencyYenIcon, MinusIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";

import { EEmpire } from "@primodiumxyz/contracts";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Hexagon } from "@/components/core/Hexagon/Hexagon";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";

export const EmpireEnumToColor = {
  [EEmpire.Blue]: "blue",
  [EEmpire.Green]: "green",
  [EEmpire.Red]: "red",
};

export const Planet: React.FC<{ entity: Entity; tileSize: number; margin: number }> = ({
  entity,
  tileSize,
  margin,
}) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(entity);
  const calls = useContractCalls();

  const [left, top] = useMemo(() => {
    const cartesianCoord = convertAxialToCartesian(
      { q: Number(planet?.q ?? 0n), r: Number(planet?.r ?? 0n) },
      tileSize + margin,
    );

    return [cartesianCoord.x, cartesianCoord.y];
  }, [planet, tileSize, margin]);

  if (!planet) return null;

  return (
    <Hexagon
      key={entity}
      fill={planet?.factionId !== 0 ? EmpireEnumToColor[planet.factionId as EEmpire] : "grey"}
      size={tileSize}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <div className="flex flex-col items-center gap-2 text-white">
        <div className="text-center">
          <p className="absolute top-4 translate-x-1/2">
            ({(planet.q ?? 0n).toLocaleString()},{(planet.r ?? 0n).toLocaleString()})
          </p>
          <p className="font-bold">{entityToPlanetName(entity)}</p>
        </div>
        <div className="rounded-lg bg-white/20 p-2">
          <p className="flex gap-2">
            <RocketLaunchIcon className="size-6" /> {planet.destroyerCount.toLocaleString()}
          </p>

          <div className="items-cetner flex gap-2">
            <TransactionQueueMask id={`${entity}-kill-destroyer`}>
              <button
                onClick={() => calls.removeDestroyer(entity)}
                className="btn btn-square btn-xs"
                disabled={planet.factionId == 0}
              >
                <MinusIcon className="size-4" />
              </button>
            </TransactionQueueMask>

            <TransactionQueueMask id={`${entity}-create-destroyer`}>
              <button
                onClick={() => calls.createDestroyer(entity)}
                className="btn btn-square btn-xs"
                disabled={planet.factionId == 0}
              >
                <PlusIcon className="size-4" />
              </button>
            </TransactionQueueMask>
          </div>
        </div>
        <div className="flex">
          <CurrencyYenIcon className="size-6" /> {planet.goldCount.toLocaleString()}
        </div>
      </div>
    </Hexagon>
  );
};
