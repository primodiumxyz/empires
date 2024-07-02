import { convertAxialToCartesian, entityToPlanetName, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity } from "@primodiumxyz/reactive-tables";
import { Hexagon } from "@/components/core/Hexagon/Hexagon";
import { Logout } from "@/components/Logout";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useTxExecute } from "@/hooks/useTxExecute";

const Game = () => {
  const { tables } = useCore();
  // const doubleCount = tables.DoubleCounter.use()?.value;
  // const { execute } = useTxExecute();

  const entities = tables.Planet.useAll();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <Logout />

      <h1 className="text-lg font-bold">Primodium Empires</h1>
      <img src={"primodium.jpg"} className="logo w-32" alt="Vite logo" />
      <div className="relative h-[500px] w-[700px] border">
        {entities.map((entity) => {
          const planet = tables.Planet.get(entity);
          const cartesianCoord = convertAxialToCartesian(
            { q: Number(planet?.q ?? 0n), r: Number(planet?.r ?? 0n) },
            100 / 1.8,
          );
          return (
            <Hexagon
              key={entity}
              fill={planet?.factionId !== 0 ? "darkred" : "grey"}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                top: `${cartesianCoord.x + 500 / 2}px`,
                left: `${cartesianCoord.y + 700 / 2}px`,
              }}
            >
              <div className="mx-auto text-center font-bold text-white">
                <p>{entityToPlanetName(entity)}</p>
                <p>
                  ({Number(planet?.q ?? 0n)},{Number(planet?.r ?? 0n)})
                </p>
              </div>
            </Hexagon>
          );
        })}
      </div>
    </div>
  );
};

export default Game;
