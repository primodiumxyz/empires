import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/solid";
import { usePrivy } from "@privy-io/react-auth";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { useBalance } from "@/hooks/useBalance";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";
import { useEthPrice } from "@/hooks/useEthPrice";

export const Account = () => {
  const { logout } = usePrivy();
  const { cancelBurner, usingBurner } = useBurnerAccount();
  const {
    utils: { ethToUSD },
  } = useCore();
  const { price, loading } = useEthPrice();

  const {
    playerAccount: { address, entity },
  } = useAccountClient();

  const handleLogout = async () => {
    if (usingBurner) cancelBurner();
    else await logout();
  };

  const balance = useBalance(address).value ?? 0n;

  return (
    <div className="absolute left-4 top-4 flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      <p className="flex items-center gap-2">
        {address.slice(0, 7)}
        <button onClick={handleLogout} className="btn btn-primary btn-sm">
          <ArrowLeftEndOnRectangleIcon className="h-4 w-4" />
        </button>
      </p>
      <hr />
      {loading && <p>Loading...</p>}
      {!loading && price && <p>{ethToUSD(balance, price)}</p>}
      <p className="text-xs">{formatEther(balance)}ETH</p>
      <hr />
      <Points playerId={entity} />
    </div>
  );
};

const Points = ({ playerId }: { playerId: Entity }) => {
  const { tables } = useCore();
  const greenPoints = tables.Value_PointsMap.useWithKeys({ factionId: EEmpire.Green, playerId })?.value ?? 0n;
  const redPoints = tables.Value_PointsMap.useWithKeys({ factionId: EEmpire.Red, playerId })?.value ?? 0n;
  const bluePoints = tables.Value_PointsMap.useWithKeys({ factionId: EEmpire.Blue, playerId })?.value ?? 0n;

  return (
    <div className="grid w-full grid-cols-[2rem_1fr] items-center">
      <div className="h-4 w-4 rounded-full bg-green-500" />
      <p>{formatNumber(greenPoints)}</p>
      <div className="h-4 w-4 rounded-full bg-red-500" />
      <p>{formatNumber(redPoints)}</p>
      <div className="h-4 w-4 rounded-full bg-blue-500" />
      <p>{formatNumber(bluePoints)}</p>
    </div>
  );
};
