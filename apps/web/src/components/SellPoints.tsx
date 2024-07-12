import { useState } from "react";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";

export const SellPoints = () => {
  const [empire, selectEmpire] = useState<EEmpire>(EEmpire.Green);
  return (
    <div className="absolute bottom-4 left-4 flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      <p className="text-left text-xs font-bold uppercase">Sell Points</p>
      <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
        <select
          value={empire}
          onChange={(e) => selectEmpire(Number(e.target.value) as EEmpire)}
          className="bg-dark text-black"
        >
          <option value={EEmpire.Green}>Green</option>
          <option value={EEmpire.Red}>Red</option>
          <option value={EEmpire.Blue}>Blue</option>
        </select>
        <SellEmpirePoints empire={empire} />
      </div>
    </div>
  );
};

const SellEmpirePoints = ({ empire }: { empire: EEmpire }) => {
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const { tables } = useCore();
  const playerPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId: entity })?.value ?? 0n;
  return (
    <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
      <p className="text-xs">Sell {formatEther(playerPoints)} Empire Points</p>
      <button className="btn btn-primary">Sell</button>
    </div>
  );
};
