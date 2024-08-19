import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { Cheatcodes } from "@/components/Cheatcodes";
import { HUD } from "@/components/core/HUD";
import { GameOver } from "@/components/GameOver";
import { ModeToggle } from "@/components/ModeToggle";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverridePopup } from "@/components/OverridePopup";
import { PlayerReturns } from "@/components/PlayerReturns";
import { Pot } from "@/components/Pot";
import { PriceHistory } from "@/components/PriceHistory";
import { Dashboard } from "@/components/PriceHistory/Dashboard";
import { QuickTrade } from "@/components/PriceHistory/QuickTrade";
import { Settings } from "@/components/Settings";
import { TimeLeft } from "@/components/TimeLeft";

const DEV = import.meta.env.PRI_DEV === "true";

export const AdvancedHUD = () => {
  const params = new URLSearchParams(window.location.search);
  const showCheatcodes = DEV && !!params.get("showCheatcodes");

  return (
    <HUD pad>
      <HUD.TopLeft>
        <PriceHistory />
        <Pot className="lg:hidden" />
      </HUD.TopLeft>

      <HUD.TopMiddle className="flex flex-col items-center">
        {showCheatcodes && <Cheatcodes />}
        <div className="flex flex-col items-center">
          <Dashboard />
          <div className="relative hidden h-[300px] w-[300px] lg:block">
            <QuickTrade />
          </div>
        </div>
      </HUD.TopMiddle>

      <HUD.TopRight className="flex flex-col gap-2">
        <Account />
      </HUD.TopRight>

      <HUD.Left className="lg:hidden">
        <QuickTrade />
      </HUD.Left>

      <HUD.BottomLeft className="flex w-[300px] flex-col gap-2 lg:items-end">
        <ModeToggle />
        <div className="flex w-full items-center gap-2 lg:justify-between">
          <MusicPlayer />
          <Settings />
        </div>
        <ActionLog />
      </HUD.BottomLeft>

      <HUD.BottomMiddle>
        <TimeLeft />
      </HUD.BottomMiddle>

      <HUD.Center>
        <OverridePopup />
        <GameOver />
      </HUD.Center>

      <HUD.BottomRight className="flex gap-2">
        <PlayerReturns />
      </HUD.BottomRight>
    </HUD>
  );
};
