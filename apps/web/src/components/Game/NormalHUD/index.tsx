import { UserIcon } from "@heroicons/react/24/solid";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatAddress } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Card } from "@/components/core/Card";
import { BoostSell } from "@/components/Game/NormalHUD/BoostSell";
import { EmpireCard } from "@/components/Game/NormalHUD/EmpireCard";
import { PlayerReturns } from "@/components/Game/NormalHUD/PlayerReturns";
import { GameOver } from "@/components/GameOver";
import { ModeToggle } from "@/components/ModeToggle";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Pot } from "@/components/Pot";
import { HistoricalPointGraph } from "@/components/PriceHistory/HistoricalPointGraph";
import { Price } from "@/components/shared/Price";
import { TimeLeft } from "@/components/TimeLeft";
import { useBalance } from "@/hooks/useBalance";
import { useEmpires } from "@/hooks/useEmpires";
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
  const empires = useEmpires();
  const { gameOver } = useWinningEmpire();
  const turn = tables.Turn.use();
  const balance = useBalance(address).value ?? 0n;
  tables.Time.use();

  return (
    <div className="grid h-screen grid-cols-[1fr_max(25rem,30%)] grid-rows-[auto_auto_auto_auto_1fr] gap-4 p-3">
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
      <div className="row-span-4">
        <Card noDecor className="h-full bg-gradient-to-b from-black to-[#181818]">
          <div className="grid h-full grid-rows-[1fr_auto] gap-8">
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
            {/* grid with automatic sizing with just a minimum size of 10rem */}
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
        <Card noDecor className="pb-5">
          <BoostSell />
        </Card>
      </div>

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
