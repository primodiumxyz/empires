import { resourceToHex } from "@latticexyz/common";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { useEthPrice } from "@/hooks/useEthPrice";
import { cn } from "@/util/client";

export const Pot = () => {
  const { tables, utils } = useCore();
  const { price, loading } = useEthPrice();

  const hex = resourceToHex({
    type: "namespace",
    namespace: tables.P_GameConfig.metadata.globalName.split("__")[0],
    name: "",
  });
  const pot = tables.Balances.useWithKeys({ namespaceId: hex })?.balance ?? 0n;

  return (
    <div className="absolute right-4 top-4 flex flex-col justify-center gap-1">
      <div className="flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
        <p className="text-left text-xs font-bold uppercase">Pot</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
          {loading && <p>Loading...</p>}
          {!loading && price && <p>{utils.ethToUSD(pot, price)}</p>}
          <p className="text-xs">{formatEther(pot)}ETH</p>
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
    <div className="grid w-full grid-cols-[2rem_1fr] items-center">
      <div className={cn("h-4 w-4 rounded-full", color)} />
      <p>{formatEther(points)}</p>
    </div>
  );
};
