import { useEffect, useRef, useState } from "react";

import { Keys } from "@primodiumxyz/core";
import { useCore, useSyncStatus } from "@primodiumxyz/core/react";
import { initGame, PrimodiumGame } from "@primodiumxyz/game";
import { GameHUD } from "@/components/game/GameHUD";
import { GameProvider } from "@/hooks/providers/GameProvider";
import { useContractCalls } from "@/hooks/useContractCalls";

const Game = () => {
  const { loading, message } = useSyncStatus();
  const { loading: actionLogLoading, message: actionLogMessage } = useSyncStatus(Keys.ACTION_LOG);
  if (loading || actionLogLoading) {
    // Do nothing while the PrivyProvider initializes with updated user state
    // Same for action log, otherwise it might flash with routine updates after rendering the game
    return <div className="animate-pulse">{message || actionLogMessage}</div>;
  }
  return <_Game />;
};
const _Game = () => {
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
};

export default Game;
