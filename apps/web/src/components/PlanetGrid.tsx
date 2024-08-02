import { useCore } from "@primodiumxyz/core/react";
import { Planet } from "@/components/Planet";

export const PlanetGrid: React.FC<{ tileSize?: number; margin?: number }> = ({ tileSize = 150, margin = 10 }) => {
  const { tables } = useCore();
  const entities = tables.Planet.useAll();

  return (
    <div className="relative">
      {entities.map((entity) => {
        return <Planet key={entity} entity={entity} tileSize={tileSize} margin={margin} />;
      })}
    </div>
  );
};
