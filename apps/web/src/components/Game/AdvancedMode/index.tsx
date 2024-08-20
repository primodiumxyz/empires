import { InterfaceIcons } from "@primodiumxyz/assets";
import { useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { Cheatcodes } from "@/components/Cheatcodes";
import { Button } from "@/components/core/Button";
import { HUD } from "@/components/core/HUD";
import { IconLabel } from "@/components/core/IconLabel";
import { PriceHistory } from "@/components/Dashboard";
import { GameOver } from "@/components/GameOver";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverridePopup } from "@/components/OverridePopup";
import { PlayerReturns } from "@/components/PlayerReturns";
import { Portfolio } from "@/components/Portfolio";
import { Pot } from "@/components/Pot";
import { QuickTradeModal, QuickTradeTabs } from "@/components/QuickTrade/QuickTrade";
import { Settings } from "@/components/Settings";
import { TimeLeft } from "@/components/TimeLeft";

const DEV = import.meta.env.PRI_DEV === "true";

export const AdvancedHUD = () => {
  const params = new URLSearchParams(window.location.search);
  const showCheatcodes = DEV && !!params.get("showCheatcodes");

  const { tables } = useCore();
  const advancedMode = tables.AdvancedMode.use()?.value ?? false;
  return (
    <HUD pad>
      <HUD.TopLeft>
        <PriceHistory />
        <Pot className="lg:hidden" />
      </HUD.TopLeft>

      <HUD.TopMiddle className="flex flex-col items-center">
        <Button
          size="md"
          variant="neutral"
          className="z-50 w-56"
          onClick={() => tables.AdvancedMode.set({ value: !advancedMode })}
        >
          <IconLabel imageUri={InterfaceIcons.Trade} text="DASHBOARD" className="" />
        </Button>

        <div className="hidden flex-col items-center lg:flex">
          <div className="relative hidden w-[300px] lg:block">
            <QuickTradeTabs />
          </div>
        </div>

        {showCheatcodes && (
          <>
            <div className="h-[32px]" />
            <Cheatcodes />
          </>
        )}
      </HUD.TopMiddle>
      <HUD.Left className="lg:hidden">
        <QuickTradeModal />
      </HUD.Left>
      <HUD.TopRight className="flex flex-col gap-1">
        <Account />
        <hr className="my-1 w-full border-secondary/50" />
        <Portfolio />
      </HUD.TopRight>

      <HUD.BottomLeft className="flex w-[300px] flex-col gap-2 lg:items-end">
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

      <HUD.BottomRight>
        <PlayerReturns />
      </HUD.BottomRight>
    </HUD>
  );
};
