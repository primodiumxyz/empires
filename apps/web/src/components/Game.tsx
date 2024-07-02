import { Logout } from "@/components/Logout";
import { PlanetGrid } from "@/components/PlanetGrid";

const Game = () => {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <Logout />
      <PlanetGrid tileSize={100} />
    </div>
  );
};

export default Game;
