import { memo, useEffect, useRef, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { initGame, PrimodiumGame } from "@primodiumxyz/game";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { Cheatcodes } from "@/components/Cheatcodes";
import { HUD } from "@/components/core/HUD";
import { GameOver } from "@/components/GameOver";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverridePopup } from "@/components/OverridePopup";
import { PlayerReturns } from "@/components/PlayerReturns";
import { Pot } from "@/components/Pot";
import { PriceHistory } from "@/components/PriceHistory";
import { Dashboard } from "@/components/PriceHistory/Dashboard";
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
          <Pot className="lg:hidden" />
        </HUD.TopLeft>

        <HUD.TopMiddle>
          {DEV && <Cheatcodes />}
          <Dashboard />
        </HUD.TopMiddle>

        <HUD.TopRight className="flex flex-col gap-2">
          <Account />
        </HUD.TopRight>

        <HUD.BottomLeft className="flex w-[300px] flex-col gap-2">
          <div className="flex w-full items-center gap-2 lg:justify-between">
            <MusicPlayer />
            <Settings />
          </div>
          <ActionLog />
        </HUD.BottomLeft>

        <HUD.BottomMiddle>
          <TimeLeft />
        </HUD.BottomMiddle>

        <HUD.Center className="relative z-50">
          <OverridePopup />
          <GameOver />
        </HUD.Center>

        <HUD.BottomRight className="flex gap-2">
          <PlayerReturns />
        </HUD.BottomRight>
      </HUD>
    </>
  );
};

export default Game;
