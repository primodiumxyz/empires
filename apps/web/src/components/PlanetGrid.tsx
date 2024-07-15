import { useEffect, useState } from "react";
import { Hex } from "viem";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Arrow } from "@/components/Arrow";
import { Planet } from "@/components/Planet";

export const PlanetGrid: React.FC<{ tileSize?: number; margin?: number }> = ({ tileSize = 150, margin = 10 }) => {
  const {
    tables,
    network: { world },
  } = useCore();
  const entities = tables.Planet.useAll();
  const [currentData, setCurrentData] = useState<
    {
      id: string;
      originPlanetId: Hex;
      destinationPlanetId: Hex;
      shipCount: bigint;
    }[]
  >([]);

  useEffect(() => {
    const listener = tables.MoveNPCAction.update$.subscribe(({ entity, properties: { current } }) => {
      if (!current) return;
      const { originPlanetId, destinationPlanetId, shipCount } = current;

      setCurrentData((prevData) => [...prevData, { id: entity, originPlanetId, destinationPlanetId, shipCount }]);

      setTimeout(() => {
        setCurrentData((prevData) => prevData.filter((item) => item.id !== entity));
      }, 3000);
    });

    return () => {
      listener.unsubscribe();
    };
  }, []);

  return (
    <div className="relative">
      {currentData.map((item) => {
        return (
          <Arrow
            key={item.id}
            originPlanetId={item.originPlanetId as Entity}
            destinationPlanetId={item.destinationPlanetId as Entity}
            shipCount={item.shipCount}
            tileSize={tileSize}
            margin={margin}
          />
        );
      })}
      {entities.map((entity) => {
        return <Planet key={entity} entity={entity} tileSize={tileSize} margin={margin} />;
      })}
    </div>
  );
};
