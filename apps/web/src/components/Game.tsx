import { memo, useEffect, useRef, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { initGame, PrimodiumGame } from "@primodiumxyz/game";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { Cheatcodes } from "@/components/Cheatcodes";
import { HUD } from "@/components/core/HUD";
import { Dashboard } from "@/components/Dashboard";
import { HistoricalPointPriceModal } from "@/components/HistoricalPointPriceModal";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverrideDrawer } from "@/components/OverrideDrawer";
import { Pot } from "@/components/Pot";
import { PriceHistory } from "@/components/PriceHistory";
import { SellPoints } from "@/components/SellPoints";
import { Settings } from "@/components/Settings";
import { TimeLeft } from "@/components/TimeLeft";
import { GameProvider } from "@/hooks/providers/GameProvider";
import { useContractCalls } from "@/hooks/useContractCalls";

const DEV = import.meta.env.PRI_DEV === "true";

const Game = memo(() => {
  const core = useCore();
  const contractCalls = useContractCalls();
  const [loading, setLoading] = useState<boolean>(true);
  const gameRef = useRef<PrimodiumGame | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (gameRef.current || hasInitialized.current) return;

      try {
        hasInitialized.current = true;
        destroy();
        setLoading(true);
        const pri = await initGame(core, contractCalls);
        gameRef.current = pri;
        pri.runSystems();
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    const destroy = async () => {
      if (gameRef.current === null) return;
      gameRef.current.destroy();
      gameRef.current = null;
      hasInitialized.current = false;
      // await new Promise((resolve) => setTimeout(resolve, 100));
      const phaserContainer = document.getElementById("phaser-container");
    };

    init();

    return () => {
      destroy();
    };
  }, []);

  return (
    <>
      {loading && !gameRef.current && (
        <div className="absolute flex flex-col items-center justify-center gap-4 text-white">
          <p className="text-white">
            <span className="animate-pulse">LOADING GAME</span>
          </p>
        </div>
      )}

      {/* cannot unmount. needs to be visible for phaser to attach to DOM element */}
      <div id="game-container" className="screen-container">
        <div id="phaser-container" className="screen-container pointer-events-auto absolute cursor-pointer"></div>
        {!!gameRef.current && !loading && (
          <GameProvider game={gameRef.current}>
            <div className="pointer-events-auto relative">
              <GameHUD />
            </div>
          </GameProvider>
        )}
      </div>
    </>
  );
});

export const GameHUD = () => {
  return (
    <>
      <HUD pad>
        <HUD.TopLeft>
          <PriceHistory />
        </HUD.TopLeft>

        <HUD.TopMiddle>
          <Pot className="w-48" />
        </HUD.TopMiddle>

        <HUD.TopRight>
          <Account />
        </HUD.TopRight>

        <HUD.BottomLeft>
          <div className="flex w-48 flex-col gap-2">
            <SellPoints />
            <MusicPlayer />
          </div>
        </HUD.BottomLeft>

        <HUD.BottomMiddle>
          <TimeLeft />
          <AdvanceTurn />
        </HUD.BottomMiddle>
        <HUD.BottomMiddle>
          <OverrideDrawer />
        </HUD.BottomMiddle>

        <HUD.BottomRight className="flex gap-2">
          <Settings />
          <ActionLog />
          <HistoricalPointPriceModal showIcon={true} />
          {DEV && <Cheatcodes className="-mr-1" />}
        </HUD.BottomRight>
      </HUD>
      <HUD>
        <HUD.Right>
          <Dashboard />
        </HUD.Right>
      </HUD>
    </>
  );
};

export default Game;
