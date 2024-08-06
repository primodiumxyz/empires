import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { Card } from "@/components/core/Card";
import { Price } from "@/components/shared/Price";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

interface PotProps {
  className?: string;
}

export const Pot: React.FC<PotProps> = ({ className }) => {
  const { pot } = usePot();

  return (
    <div className={cn(className)}>
      <Card noDecor>
        <div className="flex flex-col justify-center gap-2 text-center">
          {/* Pot */}
          <div className="flex flex-col justify-center">
            <div className="flex flex-row items-center justify-center gap-3">
              <p className="text-left text-sm font-bold uppercase">Pot </p>
              <Price wei={pot} className="text-xs" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const EmpirePoints = ({ empire }: { empire: EEmpire }) => {
  const { tables } = useCore();
  const points = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const color = empire == EEmpire.Blue ? "bg-blue-500" : empire == EEmpire.Green ? "bg-green-500" : "bg-red-500";

  return (
    <Badge
      variant="glass"
      size="md"
      className={cn("flex h-6 w-full items-center justify-start gap-2 border-none", EmpireEnumToColor[empire])}
    >
      <div className={cn("h-4 w-4 rounded-full", EmpireEnumToColor[empire])} />
      <p>{formatEther(points)}</p>
    </Badge>
  );
};
