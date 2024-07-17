import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/solid";
import { usePrivy } from "@privy-io/react-auth";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Divider } from "@/components/core/Divider";
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
    <div className="absolute left-4 top-4">
      <Card className="flex flex-col justify-center gap-1 text-center" noDecor>
        <p className="text-left text-xs font-bold uppercase">Account</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-white/50 p-2 text-center text-white">
          <p className="flex items-center gap-2">
            <span className="font-mono text-sm">{address.slice(0, 7)}</span>
            <Button onClick={handleLogout} variant="neutral" size="sm">
              <ArrowLeftEndOnRectangleIcon className="size-4" />
            </Button>
          </p>
          <Divider className="my-1 w-16 self-center" />
          {loading && <p>Loading...</p>}
          {!loading && price && <p>{ethToUSD(balance, price)}</p>}
          <p className="text-xs">{formatEther(balance)}ETH</p>
          <Divider className="my-1 w-16 self-center" />
          <Points playerId={entity} />
        </div>
      </Card>
    </div>
  );
};

const Points = ({ playerId }: { playerId: Entity }) => {
  const { tables } = useCore();
  const greenPlayerPoints = tables.Value_PointsMap.useWithKeys({ factionId: EEmpire.Green, playerId })?.value ?? 0n;
  const redPlayerPoints = tables.Value_PointsMap.useWithKeys({ factionId: EEmpire.Red, playerId })?.value ?? 0n;
  const bluePlayerPoints = tables.Value_PointsMap.useWithKeys({ factionId: EEmpire.Blue, playerId })?.value ?? 0n;

  const greenEmpirePoints = tables.Faction.useWithKeys({ id: EEmpire.Green })?.pointsIssued ?? 0n;
  const redEmpirePoints = tables.Faction.useWithKeys({ id: EEmpire.Red })?.pointsIssued ?? 0n;
  const blueEmpirePoints = tables.Faction.useWithKeys({ id: EEmpire.Blue })?.pointsIssued ?? 0n;

  const greenPctTimes10000 = greenEmpirePoints > 0 ? (greenPlayerPoints * 10000n) / greenEmpirePoints : 0n;
  const redPctTimes10000 = redEmpirePoints > 0 ? (redPlayerPoints * 10000n) / redEmpirePoints : 0n;
  const bluePctTimes10000 = blueEmpirePoints > 0 ? (bluePlayerPoints * 10000n) / blueEmpirePoints : 0n;

  const greenPct = Number(greenPctTimes10000) / 100;
  const redPct = Number(redPctTimes10000) / 100;
  const bluePct = Number(bluePctTimes10000) / 100;

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="glass" size="md" className="flex h-6 w-full items-center justify-start gap-2 bg-green-600">
        <div className="size-4 rounded-full bg-green-600" />
        <p>
          {formatEther(greenPlayerPoints)}{" "}
          {greenPct > 0 && <span className="text-xs opacity-70">({formatNumber(greenPct)}%)</span>}
        </p>
      </Badge>
      <Badge variant="glass" size="md" className="flex h-6 w-full items-center justify-start gap-2 bg-red-600">
        <div className="h-4 w-4 rounded-full bg-red-600" />
        <p>
          {formatEther(redPlayerPoints)}{" "}
          {redPct > 0 && <span className="text-xs opacity-70">({formatNumber(redPct)}%)</span>}
        </p>
      </Badge>
      <Badge variant="glass" size="md" className="flex h-6 w-full items-center justify-start gap-2 bg-blue-600">
        <div className="h-4 w-4 rounded-full bg-blue-600" />
        <p>
          {formatEther(bluePlayerPoints)}{" "}
          {bluePct > 0 && <span className="text-xs opacity-70">({formatNumber(bluePct)}%)</span>}
        </p>
      </Badge>
    </div>
  );
};
