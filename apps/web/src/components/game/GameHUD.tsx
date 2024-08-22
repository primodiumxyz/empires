import { InterfaceIcons } from "@primodiumxyz/assets";
import { EViewMode } from "@primodiumxyz/core";
import { usePlayerAccount } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { Cheatcodes } from "@/components/cheatcodes/Cheatcodes";
import { Button } from "@/components/core/Button";
import { HUD } from "@/components/core/HUD";
import { IconLabel } from "@/components/core/IconLabel";
import { Dashboard } from "@/components/dashboard";
import { Empires } from "@/components/empires/Empires";
import { GameOver } from "@/components/GameOver";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverridePopup } from "@/components/override-popup";
import { PlayerReturns } from "@/components/PlayerReturns";
import { Portfolio } from "@/components/Portfolio";
import { Pot } from "@/components/Pot";
import { QuickTradeMapMode, QuickTradeModal } from "@/components/quick-trade";
import { Settings } from "@/components/settings";
import { TimeLeft } from "@/components/TimeLeft";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

const DEV = import.meta.env.PRI_DEV === "true";
export const GameHUD = () => {
  const { ViewMode } = useSettings();
  const viewMode = ViewMode.use()?.value ?? EViewMode.Map;
  const params = new URLSearchParams(window.location.search);
  const showCheatcodes = DEV && !!params.get("showCheatcodes");
  const showMap = viewMode === EViewMode.Map;
  const { playerAccount } = usePlayerAccount();
  return (
    <>
      <div
        className={cn(
          "absolute inset-0 h-screen w-screen bg-black transition-opacity duration-300",
          showMap ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100",
        )}
      />
      <HUD pad>
        {/* TOP */}
        <HUD.TopLeft className="gap-2">
          <Pot />
          <div className={cn("hidden transition-opacity duration-300 lg:block", showMap ? "opacity-100" : "opacity-0")}>
            <hr className="my-1 w-full border-secondary/50" />
            <Empires />
          </div>
        </HUD.TopLeft>

        <HUD.TopMiddle className="flex flex-col items-center">
          <Button
            size="md"
            variant="neutral"
            className="z-50 w-56"
            onClick={() => ViewMode.set({ value: showMap ? EViewMode.Dashboard : EViewMode.Map })}
          >
            {showMap ? (
              <IconLabel imageUri={InterfaceIcons.Trade} text="DASHBOARD" />
            ) : (
              <IconLabel imageUri={InterfaceIcons.Starmap} text="MAP" />
            )}
          </Button>
          {showMap && <QuickTradeMapMode className="hidden lg:flex" />}
          {showCheatcodes && <Cheatcodes />}
        </HUD.TopMiddle>

        <HUD.TopRight className="z-[1000] flex flex-col gap-1">
          <Account className="gap-0" />
          <div
            className={cn("flex flex-col gap-1 transition-opacity duration-300", showMap ? "opacity-100" : "opacity-0")}
          >
            {playerAccount && (
              <>
                <hr className="my-1 w-full border-secondary/50" />
                <Portfolio playerId={playerAccount.entity} />
              </>
            )}
          </div>
        </HUD.TopRight>

        <HUD.Left className="z-10 lg:hidden">
          <QuickTradeModal />
        </HUD.Left>

        <HUD.Center className="z-10">
          <OverridePopup />
          <GameOver />
          <Dashboard />
        </HUD.Center>

        <HUD.BottomLeft className="flex w-[300px] flex-col gap-2">
          {showMap && <ActionLog className="hidden lg:flex" />}
          <div className="pointer-events-auto flex w-full items-center gap-2">
            <MusicPlayer />
            <Settings />
          </div>
        </HUD.BottomLeft>

        <HUD.BottomMiddle>
          <TimeLeft className="gap-0" />
        </HUD.BottomMiddle>

        {playerAccount && (
          <HUD.BottomRight>
            <PlayerReturns playerId={playerAccount.entity} />
          </HUD.BottomRight>
        )}
      </HUD>
    </>
  );
};
