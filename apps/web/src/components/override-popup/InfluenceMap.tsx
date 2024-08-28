import React from "react";

import { EDirection } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";

interface Planet {
  id: Entity;
  q: number;
  r: number;
  influence: number;
}

interface Props {
  sourcePlanet: Entity;
}

export const InfluenceMap: React.FC<Props> = ({ sourcePlanet }) => {
  const { tables, utils } = useCore();
  const planets: Planet[] = [];

  const { heatmap, influenceMap } = utils.createHeatmap(sourcePlanet);
  const maxInfluence = Math.max(...Array.from(influenceMap.values()));
  const minInfluence = Math.min(...Array.from(influenceMap.values()));

  // Convert influenceMap to array of planets with coordinates
  influenceMap.forEach((influence, planetId) => {
    const planetData = tables.Planet.get(planetId);
    if (planetData) {
      planets.push({
        id: planetId,
        q: Number(planetData.q),
        r: Number(planetData.r),
        influence,
      });
    }
  });

  // Calculate color based on influence
  const getColor = (influence: number) => {
    const normalizedInfluence = (influence - minInfluence) / (maxInfluence - minInfluence);
    const red = Math.round(255 * normalizedInfluence);
    const green = Math.round(255 * (1 - normalizedInfluence));
    return `rgb(${red}, ${green}, 0)`;
  };

  // Hex grid positioning
  const hexSize = 20; // Size of hexagon
  const hexWidth = hexSize * Math.sqrt(3);
  const hexHeight = hexSize * 2;

  const getHexPosition = (q: number, r: number) => {
    q = q - 100;
    const x = hexWidth * (q + r / 2);
    const y = hexHeight * (3 / 4) * r;
    return { x, y };
  };

  return (
    <div className="relative h-96 w-96 bg-gray-800">
      {/* Heatmap Values */}
      <div className="absolute left-2 top-2 -translate-y-1/2 rounded bg-black p-2 text-xs shadow">
        <h3 className="mb-1 font-bold">Weights:</h3>
        {Array.from(heatmap.entries()).map(([direction, value]) => (
          <div key={direction} className="text-xs">
            {EDirection[direction]}: {value.toFixed(1)}
          </div>
        ))}
      </div>
      {/* Planets */}
      {planets.map((planet) => {
        const { x, y } = getHexPosition(planet.q, planet.r);
        return (
          <div
            key={planet.id}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform rounded-full text-center text-[0.6rem] text-white"
            style={{
              left: `${x + 200}px`,
              top: `${y + 200}px`,
              backgroundColor: planet.id === sourcePlanet ? "rgb(0, 0, 255)" : getColor(planet.influence),
            }}
            title={`Planet ${planet.id}: Influence ${planet.influence.toFixed(2)}`}
          >
            {planet.influence.toFixed(1)}
          </div>
        );
      })}

      {/* Source Planet */}
      {(() => {
        const sourceData = tables.Planet.get(sourcePlanet);
        if (sourceData) {
          const { x, y } = getHexPosition(Number(sourceData.q), Number(sourceData.r));
          return (
            <div
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white bg-blue-500"
              style={{
                left: `${x + 200}px`,
                top: `${y + 200}px`,
              }}
              title="Source Planet"
            />
          );
        }
        return null;
      })()}
    </div>
  );
};
