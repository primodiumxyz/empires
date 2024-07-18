import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/solid";
import { usePrivy } from "@privy-io/react-auth";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatAddress, formatNumber } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Divider } from "@/components/core/Divider";
import { useBalance } from "@/hooks/useBalance";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";
import { useEthPrice } from "@/hooks/useEthPrice";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600",
  [EEmpire.Green]: "bg-green-600",
  [EEmpire.Red]: "bg-red-600",
  [EEmpire.LENGTH]: "",
};

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
    <Card noDecor>
      <div className="flex flex-col justify-center gap-1 text-center">
        <p className="text-left text-xs font-bold uppercase">Account</p>
        <div className="flex flex-col justify-center gap-1 rounded border border-gray-600 p-2 text-center text-white">
          <p className="flex items-center gap-2">
            <span className="text-xs">{formatAddress(address)}</span>
            <Button onClick={handleLogout} variant="neutral" size="sm">
              <ArrowLeftEndOnRectangleIcon className="size-4" />
            </Button>
          </p>
          <Divider className="my-1 w-16 self-center" />
          {loading && <p>Loading...</p>}
          {!loading && price && <p>{ethToUSD(balance, price)}</p>}
          <p className="text-xs">{formatEther(balance)}ETH</p>
          <Divider className="my-1 w-16 self-center" />
          <div className="flex flex-col gap-1">
            <EmpirePoints empire={EEmpire.Red} playerId={entity} />
            <EmpirePoints empire={EEmpire.Green} playerId={entity} />
            <EmpirePoints empire={EEmpire.Blue} playerId={entity} />
          </div>
        </div>
      </div>
    </Card>
  );
};

const EmpirePoints = ({ empire, playerId }: { empire: EEmpire; playerId: Entity }) => {
  const { tables } = useCore();

  const playerPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId })?.value ?? 0n;
  const empirePoints = tables.Faction.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pctTimes10000 = empirePoints > 0 ? (playerPoints * 10000n) / empirePoints : 0n;
  const pct = Number(pctTimes10000) / 100;

  return (
    <Badge
      variant="glass"
      size="md"
      className={cn("flex h-6 w-full items-center justify-start gap-2 border-none", EmpireEnumToColor[empire])}
    >
      <div className={cn("h-4 w-4 rounded-full", EmpireEnumToColor[empire])} />
      <p>
        {formatEther(playerPoints)} {pct > 0 && <span className="text-xs opacity-70">({formatNumber(pct)}%)</span>}
      </p>
    </Badge>
  );
};
