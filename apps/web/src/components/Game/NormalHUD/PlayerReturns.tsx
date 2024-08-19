import { useMemo } from "react";
import { ArrowDownIcon, ArrowUpIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tooltip } from "@/components/core/Tooltip";
import { Price } from "@/components/shared/Price";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePoints } from "@/hooks/usePoints";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE } from "@/util/lookups";

export const PlayerReturns = () => {
  const { tables } = useCore();

  const {
    playerAccount: { entity: playerId },
  } = useAccountClient();
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
    <div className="flex justify-around gap-2">
      <EmpireEndReward
        empire={biggestReward.empire}
        playerPoints={points[biggestReward.empire].playerPoints}
        empirePoints={points[biggestReward.empire].empirePoints}
        totalSpent={totalSpent}
      />

      <ImmediateReward playerId={playerId} />
    </div>
  );
};

const EmpireEndReward = ({
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

  const imgUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");
  const empires = useEmpires();
  const empireName = empires.get(empire)?.name;

  return (
    <div className="pointer-events-auto relative flex min-w-32 flex-col rounded-lg border border-gray-600 p-2 pt-3">
      <h2 className="absolute -top-2 left-1 flex items-center justify-end gap-2 bg-neutral px-1 font-semibold text-gray-400">
        <span className="whitespace-nowrap text-xs">Earn up to</span>
        <div className="hidden lg:block">
          <Tooltip
            tooltipContent={`Projected rewards if ${empireName} empire wins`}
            direction="left"
            className="w-56 text-xs"
          >
            <ExclamationCircleIcon className="size-3" />
          </Tooltip>
        </div>
      </h2>
      <div className={cn("flex h-full w-full flex-row items-center justify-around border-none text-sm")}>
        <img src={imgUrl} className="h-8" />
        <div className="flex flex-col">
          <Price wei={earnings} />
          {!!totalSpent && (
            <div
              className={cn("flex items-center gap-1 self-end text-xs", isProfit ? "text-green-400" : "text-red-400")}
            >
              {isProfit ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
              {(Number(percentageChange) / 100).toFixed(2).replace("-", "")}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ImmediateReward = ({ playerId }: { playerId: Entity }) => {
  const {
    tables,
    utils: { getPointPrice },
  } = useCore();
  const points = usePoints(playerId);
  const totalSpent = tables.Value_PlayersMap.use(playerId)?.loss ?? 0n;
  const empires = useEmpires();
  const time = tables.Time.use();

  const pointCosts = useMemo(
    () =>
      [...empires.keys()].map(
        (empire) => getPointPrice(empire, Number(formatEther(points[empire].playerPoints))).price,
      ),
    [empires, points, time],
  );
  const totalReward = pointCosts.reduce((sum, cost) => sum + cost, 0n);
  const percentageChange = totalSpent > 0n ? ((totalReward - totalSpent) * 10000n) / totalSpent : 0n;
  const isProfit = percentageChange >= 0n;

  return (
    <div className="pointer-events-auto relative flex min-w-28 flex-col rounded-lg border border-gray-600 p-2 pt-3">
      <h2 className="absolute -top-2 left-1 flex items-center justify-end gap-2 bg-neutral px-1 font-semibold text-gray-400">
        <span className="whitespace-nowrap text-xs">Sell now</span>
        <div className="hidden lg:block">
          <Tooltip tooltipContent="Rewards if you sell all points now" direction="left" className="w-56 text-xs">
            <ExclamationCircleIcon className="size-3" />
          </Tooltip>
        </div>
      </h2>
      <div className={cn("flex h-full w-full items-center justify-center border-none text-sm")}>
        <div className="flex flex-col">
          <Price wei={totalReward} />
          {!!totalSpent && (
            <div
              className={cn("flex items-center gap-1 self-end text-xs", isProfit ? "text-green-400" : "text-red-400")}
            >
              {isProfit ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
              {(Number(percentageChange) / 100).toFixed(2).replace("-", "")}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
