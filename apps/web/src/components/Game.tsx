import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { Logout } from "@/components/Logout";
import { PlanetGrid } from "@/components/PlanetGrid";
import { ResetGame } from "@/components/ResetGame";

const Game = () => {
  const { tables } = useCore();

  const planets = tables.Keys_FactionPlanetsSet.useWithKeys({ factionId: EEmpire.Green })?.itemKeys;
  console.log(planets?.map((planet) => entityToPlanetName(planet)));
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <Logout />
      <PlanetGrid tileSize={100} />

      <div className="absolute bottom-0 left-1/2 m-5 flex -translate-x-1/2 flex-col items-center gap-1">
        <AdvanceTurn />
        <ResetGame />
      </div>
    </div>
  );
};

export default Game;
