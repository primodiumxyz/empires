import { memo, useEffect, useRef, useState } from "react";

import { useCore } from "@primodiumxyz/core/react";
import { initGame, PrimodiumGame } from "@primodiumxyz/game";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { AdvanceTurn } from "@/components/AdvanceTurn";
import { BackgroundNebula } from "@/components/BackgroundNebula";
import { Cheatcodes } from "@/components/Cheatcodes";
import { Button } from "@/components/core/Button";
import { HUD } from "@/components/core/HUD";
import { NumberInput } from "@/components/core/NumberInput";
import { Dashboard } from "@/components/Dashboard";
import { HistoricalPointPriceModal } from "@/components/HistoricalPointPriceModal";
import { PlanetGrid } from "@/components/PlanetGrid";
import { Pot } from "@/components/Pot";
import { SellPoints } from "@/components/SellPoints";
import { TimeLeft } from "@/components/TimeLeft";
import { UserSettings } from "@/components/UserSettings";
import { GameProvider } from "@/hooks/providers/GameProvider";
import { useContractCalls } from "@/hooks/useContractCalls";

const DEV = import.meta.env.PRI_DEV === "true";

const Game = memo(() => {
  const core = useCore();
  const contractCalls = useContractCalls();
  const [loading, setLoading] = useState<boolean>(true);
  const gameRef = useRef<PrimodiumGame | null>(null);
  const hasInitialized = useRef(false);
  const [count, setCount] = useState("1");

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
        <div id="phaser-container" className="screen-container pointer-events-auto absolute z-10 cursor-pointer"></div>
        {!!gameRef.current && !loading && (
          <GameProvider game={gameRef.current}>
            <BackgroundNebula />
            <div className="pointer-events-auto relative z-20">
              <GameHUD />
              <NumberInput count={count} onChange={(val) => setCount(val)} />
              <Button
                onClick={() => {
                  gameRef.current?.MAIN.fx.emitVfx({ x: 0, y: -25 }, "DestroyerArcUpperBlue", {
                    originX: 0,
                    originY: 1,
                    depth: 1000000,
                    offset: {
                      x: -12,
                      y: 15,
                    },
                    scale: 1.3,
                    rotation: Phaser.Math.DegToRad(Number(count)),
                  });
                  gameRef.current?.MAIN.fx.emitVfx({ x: 0, y: -25 }, "DestroyerArcLowerBlue", {
                    originX: 0,
                    originY: 1,
                    depth: 1000000,
                    offset: {
                      x: -12,
                      y: 10,
                    },
                    scale: 1.3,
                    rotation: Phaser.Math.DegToRad(Number(count)),
                  });
                }}
              >
                test
              </Button>
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
          <Account />
        </HUD.TopLeft>
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
          <HistoricalPointPriceModal />
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
