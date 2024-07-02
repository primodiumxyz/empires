import { useMemo } from "react";
import { RocketLaunchIcon } from "@heroicons/react/24/solid";

import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Hexagon } from "@/components/core/Hexagon/Hexagon";

export const Planet: React.FC<{ entity: Entity; tileSize: number; margin: number }> = ({
  entity,
  tileSize,
  margin,
}) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(entity);

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
      fill={planet?.factionId !== 0 ? "darkred" : "grey"}
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
            ({Number(planet.q ?? 0n)},{Number(planet.r ?? 0n)})
          </p>
        </div>

        <p className="flex gap-2">
          <RocketLaunchIcon className="size-6" /> {planet.destroyerCount.toLocaleString()}
        </p>
      </div>
    </Hexagon>
  );
};
