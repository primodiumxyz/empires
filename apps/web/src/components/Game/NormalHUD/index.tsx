import { UserIcon } from "@heroicons/react/24/solid";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatAddress } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { ActionLog } from "@/components/ActionLog";
import { Cheatcodes } from "@/components/Cheatcodes";
import { Card } from "@/components/core/Card";
import { HUD } from "@/components/core/HUD";
import { Toggle } from "@/components/core/Toggle";
import { BoostSell } from "@/components/Game/NormalHUD/BoostSell";
import { PlayerReturns } from "@/components/Game/NormalHUD/PlayerReturns";
import { GameOver } from "@/components/GameOver";
import { ModeToggle } from "@/components/ModeToggle";
import { MusicPlayer } from "@/components/MusicPlayer";
import { OverridePopup } from "@/components/OverridePopup";
import { Pot } from "@/components/Pot";
import { PriceHistory } from "@/components/PriceHistory";
import { Dashboard } from "@/components/PriceHistory/Dashboard";
import { HistoricalPointGraph } from "@/components/PriceHistory/HistoricalPointGraph";
import { QuickTrade } from "@/components/PriceHistory/QuickTrade";
import { Settings } from "@/components/Settings";
import { Price } from "@/components/shared/Price";
import { TimeLeft } from "@/components/TimeLeft";
import { useBalance } from "@/hooks/useBalance";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import useWinningEmpire from "@/hooks/useWinningEmpire";

export const NormalHUD = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  return (
    <>
      <div className="absolute inset-0 h-screen w-screen bg-black" />
      {isMobile ? <NormalHUDMobile /> : <NormalHUDDesktop />}
    </>
  );
};

const NormalHUDDesktop = () => {
  const { tables } = useCore();
  const {
    playerAccount: { address },
  } = useAccountClient();
  const { gameOver } = useWinningEmpire();
  const turn = tables.Turn.use();
  const balance = useBalance(address).value ?? 0n;

  return (
    <div className="grid h-screen grid-cols-[1fr_20rem] grid-rows-[auto_auto_1fr_auto] gap-2 p-3">
      {/* HEADER LEFT */}
      {gameOver && <GameOver fragment className="z-10" />}
      {turn && !gameOver && (
        <div className="z-10 flex items-end justify-between gap-2">
          <TimeLeft className="px-3 text-start" />
          <Pot className="inline-flex items-baseline gap-4" />
        </div>
      )}

      {/* HEADER RIGHT */}
      <div className="z-10 flex items-end justify-end gap-2 px-3">
        <UserIcon className="w-4" />
        <p>{formatAddress(address)}</p>
      </div>

      {/* BODY LEFT */}
      <div className="row-span-3 flex flex-col gap-2">
        <Card noDecor className="h-full bg-gradient-to-b from-black to-[#181818]">
          <div className="grid h-full grid-rows-[1fr_auto] gap-2">
            <div className="h-full min-h-40 w-full">
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
            <div>cards</div>
          </div>
        </Card>
      </div>

      {/* TOP RIGHT */}
      <Card noDecor>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-end">
            MY WALLET
            <Price wei={balance} className="text-sm text-accent" />
          </div>
          <div className="min-w-60">
            <PlayerReturns />
          </div>
        </div>
      </Card>

      {/* CENTER RIGHT */}
      <Card noDecor className="z-[100]">
        <BoostSell />
      </Card>

      {/* BOTTOM RIGHT */}
      <Card noDecor>
        <div className="flex flex-col">
          <ModeToggle className="self-end" />
          <MusicPlayer className="w-full" />
        </div>
      </Card>
    </div>
  );
};

const NormalHUDMobile = () => {
  // TODO we can use HUD here
  return (
    <>
      <ModeToggle />
    </>
  );
};
