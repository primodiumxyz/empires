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
  allowNullEmpire = false,
  noCaption = false,
}: {
  points: OverridePointsReceived;
  className?: string;
  inline?: boolean;
  explicit?: boolean;
  allowNullEmpire?: boolean;
  noCaption?: boolean;
}) => {
  const { targetEmpire, value, impactedEmpires } = points;
  if (targetEmpire === EEmpire.NULL && !allowNullEmpire) return null;

  const targetEmpireName = EmpireEnumToConfig[targetEmpire].name;
  const caption =
    impactedEmpires.length > 1
      ? explicit
        ? targetEmpire === EEmpire.NULL
          ? "all empires"
          : `all empires except ${targetEmpireName}`
        : "other empires"
      : `${targetEmpireName} empire`;

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center text-xs opacity-60",
        inline && "flex-row items-baseline gap-2",
        className,
      )}
    >
      <span>+{formatEther(value)} pts</span>
      {!noCaption && <span className="text-[11px] opacity-50">for {caption}</span>}
    </div>
  );
};
