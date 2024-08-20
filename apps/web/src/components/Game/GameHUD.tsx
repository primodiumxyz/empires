import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { Cheatcodes } from "@/components/Cheatcodes";
import { Button } from "@/components/core/Button";
import { HUD } from "@/components/core/HUD";
import { IconLabel } from "@/components/core/IconLabel";
import { HistoricalPointGraph } from "@/components/Dashboard/HistoricalPointGraph";
import { EmpireCards } from "@/components/Game/BeginnerMode/EmpireCards";
import { GameOver } from "@/components/GameOver";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverridePopup } from "@/components/OverridePopup";
import { PlayerReturns } from "@/components/PlayerReturns";
import { Portfolio } from "@/components/Portfolio";
import { Pot } from "@/components/Pot";
import { QuickTradeModal } from "@/components/QuickTrade/QuickTrade";
import { Settings } from "@/components/Settings";
import { TimeLeft } from "@/components/TimeLeft";
import { cn } from "@/util/client";

const DEV = import.meta.env.PRI_DEV === "true";
export const GameHUD = () => {
  const { tables } = useCore();
  const advancedMode = tables.AdvancedMode.use()?.value ?? false;
  const params = new URLSearchParams(window.location.search);
  const showCheatcodes = DEV && !!params.get("showCheatcodes");
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 h-screen w-screen bg-black transition-opacity duration-300",
          advancedMode ? "opacity-0" : "opacity-100",
        )}
      />
      <HUD pad>
        {/* TOP */}
        <HUD.TopLeft>
          <Pot />
        </HUD.TopLeft>

        <HUD.TopRight className="z-[1000] flex flex-col gap-1">
          <Account className="gap-0" />
          <div
            className={cn(
              "flex flex-col gap-1 transition-opacity duration-300",
              advancedMode ? "opacity-100" : "opacity-0",
            )}
          >
            <hr className="my-1 w-full border-secondary/50" />
            <Portfolio />
          </div>
        </HUD.TopRight>

        <HUD.TopMiddle className="flex flex-col items-center">
          <Button
            size="md"
            variant="neutral"
            className="z-50 w-56"
            onClick={() => tables.AdvancedMode.set({ value: !advancedMode })}
          >
            {advancedMode ? (
              <IconLabel imageUri={InterfaceIcons.Trade} text="DASHBOARD" />
            ) : (
              <IconLabel imageUri={InterfaceIcons.Starmap} text="MAP" />
            )}
          </Button>
          {showCheatcodes && <Cheatcodes />}
        </HUD.TopMiddle>
        <HUD.Left className="z-10 lg:hidden">
          <QuickTradeModal />
        </HUD.Left>
        <HUD.Right
          className={cn(
            "flex h-[75vh] w-full transition-opacity duration-300",
            advancedMode ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="ml-6 grid w-[calc(100vw-32px)] grid-cols-3 gap-8 lg:ml-0 lg:!flex lg:w-full lg:flex-col">
            <div className="col-span-2 h-full min-h-40">
              <ParentSize>
                {({ width: visWidth, height: visHeight }) => (
                  <HistoricalPointGraph
                    empire={EEmpire.LENGTH}
                    width={visWidth}
                    height={visHeight}
                    margin={{ top: 20, right: 20, bottom: 30, left: 55 }}
                  />
                )}
              </ParentSize>
            </div>
            <EmpireCards />
          </div>
        </HUD.Right>
        <HUD.Center>
          <OverridePopup />
          <GameOver />
        </HUD.Center>

        {/* BOTTOM */}
        <HUD.BottomLeft className="flex flex-col">
          <div className="flex w-full items-center gap-2">
            <MusicPlayer />
            <Settings />
          </div>
        </HUD.BottomLeft>

        <HUD.BottomMiddle>
          <TimeLeft className="gap-0" />
        </HUD.BottomMiddle>

        <HUD.BottomRight>
          <PlayerReturns />
        </HUD.BottomRight>
      </HUD>
    </>
  );
};
