import { useEffect, useRef, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { initGame, PrimodiumGame } from "@primodiumxyz/game";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { Cheatcodes } from "@/components/Cheatcodes";
import { HUD } from "@/components/core/HUD";
import { Dashboard } from "@/components/Dashboard";
import { HistoricalPointPriceModal } from "@/components/HistoricalPointPriceModal";
import { PlanetGrid } from "@/components/PlanetGrid";
import { Pot } from "@/components/Pot";
import { SellPoints } from "@/components/SellPoints";
import { PriceHistory } from "@/components/PriceHistory";
import { TimeLeft } from "@/components/TimeLeft";
import { UserSettings } from "@/components/UserSettings";
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
      <HUD pad>
        <HUD.TopLeft>
          <PriceHistory />
        </HUD.TopLeft>

        <HUD.TopRight>
          <Account />
        </HUD.TopRight>

        <HUD.TopMiddle>
          <TimeLeft />
        </HUD.TopMiddle>

        <HUD.TopRight>
          <Pot />
        </HUD.TopRight>

        <HUD.Center>
          <PlanetGrid tileSize={100} />
        </HUD.Center>

        <HUD.BottomLeft>
          <SellPoints />
        </HUD.BottomLeft>

        <HUD.BottomMiddle>
          <AdvanceTurn />
        </HUD.BottomMiddle>

        <HUD.BottomRight className="flex gap-2">
          <UserSettings />
          <ActionLog />
          <HistoricalPointPriceModal showIcon={true} />

          {DEV && <Cheatcodes className="-mr-1" />}
        </HUD.BottomRight>

        <HUD.Right>
          <Dashboard />
        </HUD.Right>
      </HUD>
    </GameProvider>
  );
};

export default Game;
