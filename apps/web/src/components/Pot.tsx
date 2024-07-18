import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Badge } from "@/components/core/Badge";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

export const Pot = () => {
  const { utils } = useCore();
  const { price, loading } = useEthPrice();
  const calls = useContractCalls();

  const { pot, rake } = usePot();

  return (
    <div className="absolute right-4 top-4 flex flex-col justify-center gap-1">
      <div className="flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
        <p className="text-left text-xs font-bold uppercase">Pot</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
          {loading && <p>Loading...</p>}
          {!loading && price && <p>{utils.weiToUsd(pot, price)}</p>}
          <p className="text-xs">{formatEther(pot)}ETH</p>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
        <p className="text-left text-xs font-bold uppercase">Rake</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
          {loading && <p>Loading...</p>}
          {!loading && price && <p>{utils.weiToUsd(rake, price)}</p>}
          <p className="text-xs">{formatEther(rake)}ETH</p>
          <button className="btn btn-xs" onClick={calls.withdrawRake}>
            Withdraw
          </button>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
        <p className="text-left text-xs font-bold uppercase">Empire Points</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
          <EmpirePoints empire={EEmpire.Blue} />
          <EmpirePoints empire={EEmpire.Green} />
          <EmpirePoints empire={EEmpire.Red} />
        </div>
      </div>
    </div>
  );
};

export const EmpirePoints = ({ empire }: { empire: EEmpire }) => {
  const { tables } = useCore();
  const points = tables.Faction.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
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
