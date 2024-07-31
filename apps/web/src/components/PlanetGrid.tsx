import { useEffect, useState } from "react";
import { Hex } from "viem";

import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Arrow } from "@/components/Arrow";
import { Planet } from "@/components/Planet";

export const PlanetGrid: React.FC<{ tileSize?: number; margin?: number }> = ({ tileSize = 150, margin = 10 }) => {
  const { tables } = useCore();
  const entities = tables.Planet.useAll();
  const [arrivingShips, setArrivingShips] = useState<
    {
      id: string;
      originPlanetId: Hex;
      destinationPlanetId: Hex;
      shipCount: bigint;
    }[]
  >([]);

  const pendingMoves = tables.PendingMove.useAll().map((originPlanetId) => {
    const moveData = tables.PendingMove.get(originPlanetId)!;
    return {
      ...moveData,
      originPlanetId,
    };
  });
  useEffect(() => {
    const listener = tables.MoveRoutine.update$.subscribe(({ entity, properties: { current } }) => {
      if (!current) return;
      const { originPlanetId, destinationPlanetId, shipCount } = current;

      setArrivingShips((prevData) => [...prevData, { id: entity, originPlanetId, destinationPlanetId, shipCount }]);
      setTimeout(() => {
        setArrivingShips((prevData) => prevData.filter((item) => item.id !== entity));
      }, 5000);
    });

    return () => {
      listener.unsubscribe();
    };
  }, []);

  return (
    <div className="relative">
      {/* {arrivingShips.map((item) => {
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
      })} */}
      {entities.map((entity) => {
        return <Planet key={entity} entity={entity} tileSize={tileSize} margin={margin} />;
      })}
    </div>
  );
};
