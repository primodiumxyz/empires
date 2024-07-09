import { useMemo } from "react";
import { MinusIcon, PlusIcon, RocketLaunchIcon } from "@heroicons/react/24/solid";

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
          <p className="font-bold">{entityToPlanetName(entity)}</p>
          <p>
            ({(planet.q ?? 0n).toLocaleString()},{(planet.r ?? 0n).toLocaleString()})
          </p>
        </div>

        <p className="flex gap-2">
          <RocketLaunchIcon className="size-6" /> {planet.destroyerCount.toLocaleString()}
        </p>

        <div className="items-cetner flex gap-2">
          <TransactionQueueMask id={`${entity}-kill-destroyer`}>
            <button onClick={() => calls.removeDestroyer(entity)} className="btn btn-square btn-xs">
              <MinusIcon className="size-6" />
            </button>
          </TransactionQueueMask>

          <TransactionQueueMask id={`${entity}-create-destroyer`}>
            <button onClick={() => calls.createDestroyer(entity)} className="btn btn-square btn-xs">
              <PlusIcon className="size-6" />
            </button>
          </TransactionQueueMask>
        </div>
      </div>
    </Hexagon>
  );
};
