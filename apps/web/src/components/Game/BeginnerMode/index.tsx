import { UserIcon } from "@heroicons/react/24/solid";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatAddress } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { Card } from "@/components/core/Card";
import { HUD } from "@/components/core/HUD";
import { HistoricalPointGraph } from "@/components/Dashboard/HistoricalPointGraph";
import { BoostSell } from "@/components/Game/BeginnerMode/BoostSell";
import { EmpireCard, EmpireCards } from "@/components/Game/BeginnerMode/EmpireCards";
import { PlayerReturns } from "@/components/Game/BeginnerMode/PlayerReturns";
import { GameOver } from "@/components/GameOver";
import { ModeToggle } from "@/components/ModeToggle";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Pot } from "@/components/Pot";
import { QuickTradeModal } from "@/components/QuickTrade/QuickTrade";
import { Settings } from "@/components/Settings";
import { Price } from "@/components/shared/Price";
import { TimeLeft } from "@/components/TimeLeft";
import { useBalance } from "@/hooks/useBalance";
import { useEmpires } from "@/hooks/useEmpires";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import useWinningEmpire from "@/hooks/useWinningEmpire";

export const BeginnerModeHUD = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  return (
    <>
      <div className="absolute inset-0 h-screen w-screen bg-black" />
      {isMobile ? <BeginnerModeHUDMobile /> : <BeginnerModeHUDDesktop />}
    </>
  );
};

const BeginnerModeHUDDesktop = () => {
  const { tables } = useCore();
  const {
    playerAccount: { address },
  } = useAccountClient();
  const empires = useEmpires();
  const { gameOver } = useWinningEmpire();
  const turn = tables.Turn.use();
  const balance = useBalance(address).value ?? 0n;
  tables.Time.use();

  return (
    <div className="grid h-screen grid-cols-[1fr_min(25rem,30%)] grid-rows-[auto_auto_auto_1fr] gap-4 p-3">
      {/* HEADER LEFT */}
      {gameOver && <GameOver className="z-10" />}
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
      <div className="row-span-3">
        <Card noDecor className="h-full bg-gradient-to-b from-black to-[#181818]">
          <div className="grid h-full grid-rows-[minmax(20rem,1fr)_auto] gap-8">
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
            <div className="grid grid-cols-[repeat(auto-fill,minmax(25rem,1fr))] gap-x-8 gap-y-4 overflow-y-auto px-8">
              {[...empires.entries()]
                .sort((a, b) => Number(b[1].playerPoints) - Number(a[1].playerPoints))
                .map(([key, data]) => (
                  <EmpireCard key={key} empire={key} {...data} />
                ))}
            </div>
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
      <div className="z-[100]">
        <BoostSell />
      </div>

      {/* BOTTOM RIGHT */}
      <div className="flex items-end">
        <Card noDecor className="w-full bg-primary">
          <div className="flex flex-col">
            <ModeToggle className="self-end" />
            <MusicPlayer className="w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
};

const BeginnerModeHUDMobile = () => {
  return (
    <HUD pad>
      {/* TOP */}
      <HUD.TopLeft>
        <Pot />
      </HUD.TopLeft>

      <HUD.TopRight>
        <Account className="gap-0" />
      </HUD.TopRight>
      {/* CENTER */}
      <HUD.Left>
        <QuickTradeModal />
      </HUD.Left>
      <HUD.Right className="grid h-[75vh] w-[calc(100%-32px)] grid-cols-3 gap-8">
        <div className="col-span-2 h-full min-h-40 w-full">
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

        <GameOver className="absolute left-1/2 top-1/2 -translate-x-[calc(50%+32px)] -translate-y-1/2" />
      </HUD.Right>

      {/* BOTTOM */}
      <HUD.BottomLeft className="flex w-[300px] flex-col">
        <div className="flex w-full items-center gap-2 lg:justify-between">
          <MusicPlayer />
          <Settings />
          <ModeToggle className="py-0 lg:hidden" />
        </div>
      </HUD.BottomLeft>

      <HUD.BottomRight>
        <TimeLeft small invert className="pointer-events-auto flex-row items-center gap-6 text-xs" />
      </HUD.BottomRight>
    </HUD>
  );
};
