import { useEffect, useMemo, useRef, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { initGame, PrimodiumGame } from "@primodiumxyz/game";
import { Account } from "@/components/Account";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { Cheatcodes } from "@/components/Cheatcodes";
import { PlanetGrid } from "@/components/PlanetGrid";
import { Pot } from "@/components/Pot";
import { TimeLeft } from "@/components/TimeLeft";
import { GameProvider } from "@/hooks/providers/GameProvider";
import { useContractCalls } from "@/hooks/useContractCalls";

const DEV = import.meta.env.PRI_DEV === "true";

const Game = () => {
  const core = useCore();
  const contractCalls = useContractCalls();
  const [game, setGame] = useState<PrimodiumGame | null>(null);
  const gameRef = useRef<PrimodiumGame | null>(null);

  const init = async () => {
    try {
      if (!gameRef.current) {
        const game = await initGame(core, contractCalls);
        gameRef.current = game;
        setGame(game);
      }
    } catch (err) {
      console.error("Error initializing game", err);
    }
  };

  useEffect(() => {
    init();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
      }
    };
  }, []);

  if (!game) return null;
  return (
    <GameProvider game={game}>
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
    </GameProvider>
  );
};

export default Game;
