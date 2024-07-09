import { Account } from "@/components/Account";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { PlanetGrid } from "@/components/PlanetGrid";
import { ResetGame } from "@/components/ResetGame";

const Game = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <Account />
      <PlanetGrid tileSize={100} />

      <div className="absolute bottom-0 left-1/2 m-5 flex -translate-x-1/2 flex-col items-center gap-1">
        <AdvanceTurn />
        <ResetGame />
      </div>
    </div>
  );
};

export default Game;
