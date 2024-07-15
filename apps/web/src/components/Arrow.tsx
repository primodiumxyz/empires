import React, { useMemo } from "react";

import { convertAxialToCartesian } from "@primodiumxyz/core";

type ArrowProps = {
  origin: { q: number; r: number };
  destination: { q: number; r: number };
  shipCount: number;
  tileSize?: number;
  margin?: number;
};

export const Arrow: React.FC<ArrowProps> = ({ origin, destination, shipCount, tileSize = 150, margin = 10 }) => {
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
  console.log({ angle });
  return (
    <div
      className="z-100"
      style={{
        position: "absolute",
        left: originLeft,
        top: originTop + 50,
        width: length,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 0",
        zIndex: 100,
      }}
    >
      <svg height="40" width={length}>
        <line x1="0" y1="10" x2={length} y2="10" style={{ stroke: "white", strokeWidth: 2 }} />
        <polygon points={`${length - 10},5 ${length},10 ${length - 10},15`} style={{ fill: "white" }} />
        <text
          x={length / 2}
          y={angle > 90 && angle < 270 ? "40" : "20"}
          textAnchor="middle"
          style={{
            fill: "white",
            fontSize: "24px",
            transform: angle > 90 && angle < 270 ? "rotate(180deg)" : "none",
            transformOrigin: "center",
          }}
        >
          {shipCount}
        </text>
      </svg>
    </div>
  );
};
