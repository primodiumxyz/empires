import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { OverridePointsReceived } from "@/hooks/useOverridePointsReceived";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const PointsReceived = ({
  points,
  className,
  inline = false,
  explicit = false,
}: {
  points: OverridePointsReceived;
  className?: string;
  inline?: boolean;
  explicit?: boolean;
}) => {
  const targetEmpireName = EmpireEnumToConfig[points.targetEmpire].name;

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center text-xs opacity-60",
        inline && "flex-row items-baseline gap-2",
        className,
      )}
    >
      <span>+{formatEther(points.value)} pts</span>
      <span className="text-[11px] opacity-50">
        for{" "}
        {points.impactedEmpires.length > 1
          ? explicit
            ? `all empires except ${targetEmpireName}`
            : "other empires"
          : `${targetEmpireName} empire`}
      </span>
    </div>
  );
};
