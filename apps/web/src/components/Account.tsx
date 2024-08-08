import { ExclamationCircleIcon, UserIcon } from "@heroicons/react/24/solid";
import { usePrivy } from "@privy-io/react-auth";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatAddress, formatNumber } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Tooltip } from "@/components/core/Tooltip";
import { Price } from "@/components/shared/Price";
import { useBalance } from "@/hooks/useBalance";
import { useBurnerAccount } from "@/hooks/useBurnerAccount";
import { useGame } from "@/hooks/useGame";
import { usePointPrice } from "@/hooks/usePointPrice";

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
    playerAccount: { address, entity },
  } = useAccountClient();

  const handleLogout = async () => {
    if (usingBurner) cancelBurner();
    else await logout();
  };

  const balance = useBalance(address).value ?? 0n;

  return (
    <div className="min-w-42 flex flex-col gap-2 p-2 text-right text-xs">
      <div className="flex flex-col justify-center gap-1">
        <div className="flex w-full flex-row justify-end gap-2">
          <UserIcon className="w-4" />
          <p>{formatAddress(address)}</p>
        </div>
        <Price wei={balance} className="text-base" />
        <hr className="opacity-50" />

        <EmpirePoints empire={EEmpire.Red} playerId={entity} />
        <EmpirePoints empire={EEmpire.Green} playerId={entity} />
        <EmpirePoints empire={EEmpire.Blue} playerId={entity} />
      </div>
    </div>
  );
};

const EmpirePoints = ({ empire, playerId }: { empire: EEmpire; playerId: Entity }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();

  const playerPoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId })?.value ?? 0n;
  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const pctTimes10000 = empirePoints > 0 ? (playerPoints * 10000n) / empirePoints : 0n;
  const pct = Number(pctTimes10000) / 100;

  const { price: pointCostWei, message } = usePointPrice(empire, Number(formatEther(playerPoints)));

  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");

  return (
    <div className="flex h-full w-full items-center justify-between gap-5 border-none py-1">
      <img src={spriteUrl} className="h-12" />
      <div className="pointer-events-auto flex flex-col justify-end text-right">
        <p className="text-base">{formatEther(playerPoints)} pts</p>
        <Tooltip tooltipContent={message} className="w-44 text-xs">
          <p className="-mt-1 flex items-center justify-end gap-2 text-xs">
            <Price wei={pointCostWei} />
            {message ? <ExclamationCircleIcon className="size-3" /> : ""}
          </p>
        </Tooltip>
        {pct > 0 && <p className="text-xs opacity-70">({formatNumber(pct)}%)</p>}
      </div>
    </div>
  );
};
