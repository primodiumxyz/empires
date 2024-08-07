import { useMemo } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tooltip } from "@/components/core/Tooltip";
import { Price } from "@/components/shared/Price";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

export const PlayerReturns = () => {
  const { tables } = useCore();

  const { pot } = usePot();
  const {
    playerAccount: { entity: playerId },
  } = useAccountClient();
  const points = usePoints(playerId);
  const totalSpent = tables.Player.use(playerId)?.spent ?? 0n;
  const biggestReward = useMemo(() => {
    return Object.entries(points).reduce<{ empire: EEmpire; points: bigint }>(
      (acc, [empire, { playerPoints }]) => {
        if (playerPoints > acc.points) {
          return { empire: Number(empire) as EEmpire, points: playerPoints };
        }
        return acc;
      },
      { empire: EEmpire.Red, points: 0n },
    );
  }, [points]);

  return (
    <div className="flex w-40 flex-col gap-2">
      <div className="text-right">
        <h2 className="font-semibold text-gray-400">Pot</h2>
        <Price wei={pot} className="text-base" />
      </div>

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
  const isProfit = earnings >= totalSpent;
  const pnl = isProfit ? earnings - totalSpent : totalSpent - earnings;

  const imgUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");
  const empireName = empire === EEmpire.Red ? "Red" : empire === EEmpire.Blue ? "Blue" : "Green";
  return (
    <div className="pointer-events-auto flex flex-col gap-1 rounded-lg border border-white p-2">
      <h2 className="flex items-center justify-between gap-2 font-semibold text-gray-400">
        <span className="text-xs">Earn up to</span>
        <Tooltip
          tooltipContent={`Projected rewards if ${empireName} empire wins`}
          direction="left"
          className="w-56 text-xs"
        >
          <ExclamationCircleIcon className="size-3" />
        </Tooltip>
      </h2>
      <div className={cn("flex h-full w-full flex-row items-center justify-between border-none py-1 text-sm")}>
        <div className="flex items-center gap-1">
          <img src={imgUrl} className="h-6" />
          <Price wei={earnings} />
        </div>
        {!!totalSpent && (
          <div className={cn("text-right text-xs", isProfit ? "text-green-400" : "text-red-400")}>
            {isProfit ? "+" : "-"}
            <Price wei={pnl} />
          </div>
        )}
      </div>
    </div>
  );
};

const ImmediateReward = ({ playerId }: { playerId: Entity }) => {
  const { tables } = useCore();
  const points = usePoints(playerId);
  const totalSpent = tables.Player.use(playerId)?.spent ?? 0n;

  const { price: redPointCost } = usePointPrice(EEmpire.Red, Number(formatEther(points[EEmpire.Red].playerPoints)));
  const { price: bluePointCost } = usePointPrice(EEmpire.Blue, Number(formatEther(points[EEmpire.Blue].playerPoints)));
  const { price: greenPointCost } = usePointPrice(
    EEmpire.Green,
    Number(formatEther(points[EEmpire.Green].playerPoints)),
  );
  const totalReward = redPointCost + bluePointCost + greenPointCost;

  const isProfit = totalReward >= totalSpent;
  const pnl = isProfit ? totalReward - totalSpent : totalSpent - totalReward;

  return (
    <div className="pointer-events-auto flex flex-col gap-1 rounded-lg border border-white p-2">
      <h2 className="flex items-center justify-between gap-2 font-semibold text-gray-400">
        <span className="text-xs">Sell now</span>
        <Tooltip tooltipContent="Rewards if you sell all points now" direction="left" className="w-56 text-xs">
          <ExclamationCircleIcon className="size-3" />
        </Tooltip>
      </h2>
      <div className={cn("flex h-full w-full justify-between gap-1 border-none py-1 text-sm")}>
        <Price wei={totalReward} />
        {!!totalSpent && (
          <span className={cn(isProfit ? "text-green-400" : "text-red-400")}>
            {isProfit ? "+" : "-"}
            <Price wei={pnl} />
          </span>
        )}
      </div>
    </div>
  );
};

const usePoints = (playerId: Entity): Record<EEmpire, { playerPoints: bigint; empirePoints: bigint }> => {
  const { tables } = useCore();

  const redPlayerPoints = tables.Value_PointsMap.useWithKeys({ empireId: EEmpire.Red, playerId })?.value ?? 0n;
  const bluePlayerPoints = tables.Value_PointsMap.useWithKeys({ empireId: EEmpire.Blue, playerId })?.value ?? 0n;
  const greenPlayerPoints = tables.Value_PointsMap.useWithKeys({ empireId: EEmpire.Green, playerId })?.value ?? 0n;

  const redEmpirePoints = tables.Empire.useWithKeys({ id: EEmpire.Red })?.pointsIssued ?? 0n;
  const blueEmpirePoints = tables.Empire.useWithKeys({ id: EEmpire.Blue })?.pointsIssued ?? 0n;
  const greenEmpirePoints = tables.Empire.useWithKeys({ id: EEmpire.Green })?.pointsIssued ?? 0n;

  return {
    [EEmpire.Red]: {
      playerPoints: redPlayerPoints,
      empirePoints: redEmpirePoints,
    },
    [EEmpire.Blue]: {
      playerPoints: bluePlayerPoints,
      empirePoints: blueEmpirePoints,
    },
    [EEmpire.Green]: {
      playerPoints: greenPlayerPoints,
      empirePoints: greenEmpirePoints,
    },
    [EEmpire.LENGTH]: {
      playerPoints: 0n,
      empirePoints: 0n,
    },
  };
};
