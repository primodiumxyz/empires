import { Account } from "@/components/Account";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { Cheatcodes } from "@/components/Cheatcodes";
import { PlanetGrid } from "@/components/PlanetGrid";
import { Pot } from "@/components/Pot";
import { TimeLeft } from "@/components/TimeLeft";

const Game = () => {
  const DEV = import.meta.env.PRI_DEV === "true";
  return (
    <>
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        <Account />
        <TimeLeft />
        <Pot />
        <PlanetGrid tileSize={100} />
        <div className="absolute bottom-0 left-1/2 m-5 flex -translate-x-1/2 flex-col items-center gap-1">
          <AdvanceTurn />
        </div>
      </div>
      {DEV && <Cheatcodes />}
    </>
  );
};

export default Game;
