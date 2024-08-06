import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Card } from "@/components/core/Card";
import { Divider } from "@/components/core/Divider";
import { Tooltip } from "@/components/core/Tooltip";
import { Price } from "@/components/shared/Price";
import { usePointPrice } from "@/hooks/usePointPrice";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

export const PlayerInsight = () => {
  const { tables } = useCore();
  const {
    playerAccount: { entity: playerId },
  } = useAccountClient();
  const points = usePoints(playerId);
  const totalSpent = tables.Player.use(playerId)?.spent ?? 0n;

  return (
    <div className="w-48 text-xs">
      <Card noDecor>
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="font-semibold text-gray-400">Total spent</h2>
            <Price wei={totalSpent} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center justify-between gap-2 font-semibold text-gray-400">
              <span>End rewards</span>
              <Tooltip
                tooltipContent="Your rewards at the end of the game for each empire if it wins"
                direction="left"
                className="w-64 text-xs"
              >
                <ExclamationCircleIcon className="size-3" />
              </Tooltip>
            </h2>
            <div className="flex flex-col gap-1">
              <EmpireEndReward empire={EEmpire.Red} {...points[EEmpire.Red]} totalSpent={totalSpent} />
              <EmpireEndReward empire={EEmpire.Blue} {...points[EEmpire.Blue]} totalSpent={totalSpent} />
              <EmpireEndReward empire={EEmpire.Green} {...points[EEmpire.Green]} totalSpent={totalSpent} />
            </div>
          </div>
          <Divider className="self-center" />
          <div>
            <h2 className="flex items-center justify-between gap-2 font-semibold text-gray-400">
              <span>Immediate reward</span>
              <Tooltip
                tooltipContent="Your rewards if you sell all points right now"
                direction="left"
                className="w-64 text-xs"
              >
                <ExclamationCircleIcon className="size-3" />
              </Tooltip>
            </h2>
            <ImmediateReward playerId={playerId} />
          </div>
        </div>
      </Card>
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
  const earnings = !!empirePoints ? (pot * playerPoints) / empirePoints : 0n;
  const isProfit = earnings >= totalSpent;
  const pnl = isProfit ? earnings - totalSpent : totalSpent - earnings;

  return (
    <Badge
      variant="glass"
      size="sm"
      className={cn("flex h-full w-full justify-start gap-3 border-none py-1", EmpireEnumToColor[empire])}
    >
      <div className={cn("mx-1 size-2 rounded-full", EmpireEnumToColor[empire])} />
      <div className="flex w-full items-center justify-between gap-1">
        <Price wei={earnings} />
        {!!totalSpent && (
          <span className={cn(isProfit ? "text-green-400" : "text-red-400")}>
            {isProfit ? "+" : "-"}
            <Price wei={pnl} />
          </span>
        )}
      </div>
    </Badge>
  );
};

const ImmediateReward = ({ playerId }: { playerId: Entity }) => {
  const { tables } = useCore();
  const points = usePoints(playerId);
  const totalSpent = tables.Player.use(playerId)?.spent ?? 0n;

  const { price: redPointCost, message: redMessage } = usePointPrice(
    EEmpire.Red,
    Number(formatEther(points[EEmpire.Red].playerPoints)),
  );
  const { price: bluePointCost, message: blueMessage } = usePointPrice(
    EEmpire.Blue,
    Number(formatEther(points[EEmpire.Blue].playerPoints)),
  );
  const { price: greenPointCost, message: greenMessage } = usePointPrice(
    EEmpire.Green,
    Number(formatEther(points[EEmpire.Green].playerPoints)),
  );
  const totalReward = redPointCost + bluePointCost + greenPointCost;

  const isProfit = totalReward >= totalSpent;
  const pnl = isProfit ? totalReward - totalSpent : totalSpent - totalReward;

  return (
    <Badge variant="glass" size="sm" className={cn("flex h-full w-full justify-between gap-1 border-none py-1")}>
      <Price wei={totalReward} />
      {!!totalSpent && (
        <span className={cn(isProfit ? "text-green-400" : "text-red-400")}>
          {isProfit ? "+" : "-"}
          <Price wei={pnl} />
        </span>
      )}
    </Badge>
  );
};

const usePoints = (playerId: Entity) => {
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
  };
};
