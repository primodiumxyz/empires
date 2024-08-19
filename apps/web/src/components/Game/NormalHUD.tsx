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
import { QuickTrade } from "@/components/PriceHistory/QuickTrade";
import { Settings } from "@/components/Settings";
import { TimeLeft } from "@/components/TimeLeft";

export const NormalHUD = () => {
  return (
    <HUD pad>
      <NormalHUDDesktop className="hidden lg:flex" />
      <NormalHUDMobile className="flex lg:hidden" />
    </HUD>
  );
};

const NormalHUDDesktop = ({ className }: { className?: string }) => {
  return <div className={className}></div>;
};

const NormalHUDMobile = ({ className }: { className?: string }) => {
  return <div className={className}></div>;
};
