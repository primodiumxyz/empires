import { useMemo } from "react";
import { ArrowDownIcon, ArrowUpIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tooltip } from "@/components/core/Tooltip";
import { EmpireLogo } from "@/components/shared/EmpireLogo";
import { Price } from "@/components/shared/Price";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePoints } from "@/hooks/usePoints";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const PlayerReturns = ({ playerId }: { playerId: Entity }) => {
  const { tables } = useCore();

  const points = usePoints(playerId);
  const totalSpent = tables.Value_PlayersMap.use(playerId)?.loss ?? 0n;
  const biggestReward = useMemo(() => {
    return Object.entries(points).reduce<{ empire: EEmpire; points: bigint }>(
      (acc, [empire, { playerPoints }]) => {
        if (playerPoints > acc.points) {
          return { empire: Number(empire) as EEmpire, points: playerPoints };
        }
        return acc;
      },
      { empire: DEFAULT_EMPIRE, points: 0n },
    );
  }, [points]);

  return (
    <div className="z-10 flex justify-around gap-2">
      <EarnUpTo
        empire={biggestReward.empire}
        playerPoints={points[biggestReward.empire].playerPoints}
        empirePoints={points[biggestReward.empire].empirePoints}
        totalSpent={totalSpent}
      />

      <SellNow playerId={playerId} />
    </div>
  );
};

const EarnUpTo = ({
  empire,
  playerPoints,
  empirePoints,
  totalSpent,
}: {
  empire: EEmpire;
  playerPoints: bigint;
  empirePoints: bigint;
  totalSpent: bigint;
}) => {
  const { pot } = usePot();
  const {
    ROOT: { sprite },
  } = useGame();
  const earnings = !!empirePoints ? (pot * playerPoints) / empirePoints : 0n;
  const percentageChange = totalSpent > 0n ? ((earnings - totalSpent) * 10000n) / totalSpent : 0n;
  const isProfit = percentageChange >= 0n;

  const empires = useEmpires();
  const empireName = empires.get(empire)?.name;

  return (
    <div className="pointer-events-auto relative flex min-w-32 flex-col rounded-md border border-gray-600 p-1 lg:p-2 lg:pt-4">
      <h2 className="absolute -top-2 left-1 flex items-center justify-end gap-2 bg-neutral px-1 font-semibold text-gray-400">
        <span className="whitespace-nowrap text-xs">Earn up to</span>
        <div>
          <Tooltip
            tooltipContent={`Projected rewards if ${empireName} empire wins`}
            direction="left"
            className="w-56 text-xs"
          >
            <InformationCircleIcon className="size-3" />
          </Tooltip>
        </div>
      </h2>
      <div className={cn("flex h-full w-full flex-row items-center justify-around border-none pt-1 text-sm")}>
        <EmpireLogo empireId={empire} size="sm" />
        <div className="flex flex-col">
          <Price wei={earnings} />
          {!!totalSpent && (
            <div
              className={cn(
                "-mt-1 hidden items-center gap-1 self-end text-xs lg:flex",
                isProfit ? "text-green-400" : "text-red-400",
              )}
            >
              {isProfit ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
              {(Number(percentageChange) / 100).toFixed(1).replace("-", "")}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SellNow = ({ playerId }: { playerId: Entity }) => {
  const {
    tables,
    utils: { getPointPrice },
  } = useCore();
  const points = usePoints(playerId);
  const totalSpent = tables.Value_PlayersMap.use(playerId)?.loss ?? 0n;
  const empires = useEmpires();

  const pointPrices = useMemo(
    () =>
      [...empires.keys()].map(
        (empire) => getPointPrice(empire, Number(formatEther(points[empire].playerPoints))).price,
      ),
    [empires, points],
  );
  const totalReward = pointPrices.reduce((sum, price) => sum + price, 0n);
  const percentageChange = totalSpent > 0n ? ((totalReward - totalSpent) * 10000n) / totalSpent : 0n;
  const isProfit = percentageChange >= 0n;

  return (
    <div className="pointer-events-auto relative flex min-w-28 flex-col rounded border border-gray-600 lg:p-2 lg:pt-4">
      <div className="absolute -top-2 left-1 flex items-center justify-end gap-2 bg-neutral px-1 font-semibold text-gray-400">
        <span className="whitespace-nowrap text-xs">Sell now</span>
        <Tooltip tooltipContent="Rewards if you sell all points now" direction="left" className="w-56 text-xs">
          <InformationCircleIcon className="size-3" />
        </Tooltip>
      </div>
      <div className={cn("flex h-full w-full items-center justify-center border-none text-sm")}>
        <div className="flex flex-col">
          <Price wei={totalReward} />
          {!!totalSpent && (
            <div
              className={cn(
                "-mt-1 hidden items-center gap-1 self-end text-xs lg:flex",
                isProfit ? "text-green-400" : "text-red-400",
              )}
            >
              {isProfit ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
              {(Number(percentageChange) / 100).toFixed(1).replace("-", "")}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
