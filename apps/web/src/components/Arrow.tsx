import React, { useMemo } from "react";

import { convertAxialToCartesian, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { cn } from "@/util/client";

type ArrowProps = {
  originPlanetId: Entity;
  destinationPlanetId: Entity;
  pending?: boolean;
  shipCount?: bigint;

  tileSize?: number;
  margin?: number;
};

export const Arrow: React.FC<ArrowProps> = ({
  originPlanetId,
  destinationPlanetId,
  pending = false,
  shipCount,
  tileSize = 150,
  margin = 10,
}) => {
  const { tables } = useCore();
  const origin = tables.Planet.use(originPlanetId);
  const destination = tables.Planet.use(destinationPlanetId);
  if (!origin || !destination) return null;
  return (
    <_Arrow
      origin={{ q: origin.q, r: origin.r }}
      destination={{ q: destination.q, r: destination.r }}
      shipCount={shipCount}
      tileSize={tileSize}
      margin={margin}
      pending={pending}
    />
  );
};

type _ArrowProps = {
  origin: { q: bigint; r: bigint };
  destination: { q: bigint; r: bigint };
  shipCount?: bigint;
  pending?: boolean;
  tileSize?: number;
  margin?: number;
};

const _Arrow: React.FC<_ArrowProps> = ({ origin, destination, shipCount, pending, tileSize = 150, margin = 10 }) => {
  const [originLeft, originTop, destinationLeft, destinationTop] = useMemo(() => {
    const originCartesianCoord = convertAxialToCartesian(
      { q: Number(origin.q ?? 0n), r: Number(origin.r ?? 0n) },
      tileSize + margin,
    );
    const destinationCartesianCoord = convertAxialToCartesian(
      { q: Number(destination.q ?? 0n), r: Number(destination.r ?? 0n) },
      tileSize + margin,
    );
    return [originCartesianCoord.x, originCartesianCoord.y, destinationCartesianCoord.x, destinationCartesianCoord.y];
  }, [origin, destination, tileSize, margin]);
  const angle = (Math.atan2(destinationTop - originTop, destinationLeft - originLeft) * (180 / Math.PI) + 360) % 360;

  const length = Math.sqrt((destinationLeft - originLeft) ** 2 + (destinationTop - originTop) ** 2);

  const antiRotation = angle < 90 || angle > 270 ? angle : angle;
  return (
    <div
      className="z-100 animate-move-along-angle pointer-events-none"
      style={{
        position: "absolute",
        left: originLeft,
        top: originTop + 50,
        width: length,
        // @ts-ignore
        "--rotation": `${angle}deg`,
        transformOrigin: "0 50%",
        zIndex: 100,
      }}
    >
      {shipCount !== undefined && shipCount !== 0n && (
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-white bg-secondary p-1 text-xs text-white",
          )}
          style={{
            transform: `rotate(-${antiRotation}deg) translateY(-50%) translateX(-50%)`,
            transformOrigin: "top left",
          }}
        >
          {formatNumber(shipCount)} ships
        </div>
      )}
      <svg height="40" width={length}>
        <line
          x1="30"
          y1="20"
          x2={length - 59}
          y2="20"
          style={{ stroke: pending ? "yellow" : "white", strokeWidth: 20, opacity: pending ? 0.5 : 0.8 }}
        />
        <polygon
          points={`${length - 59},0 ${length - 30},20 ${length - 59},40`}
          style={{ fill: pending ? "yellow" : "white", opacity: pending ? 0.5 : 0.8 }}
        />
      </svg>
    </div>
  );
};
