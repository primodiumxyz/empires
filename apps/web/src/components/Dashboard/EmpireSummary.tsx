import { CurrencyYenIcon, RocketLaunchIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { Core } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToEmpireSprites } from "@primodiumxyz/game";
import { Entity, Properties } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Card } from "@/components/core/Card";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

type Planet = { entity: Entity; properties: Properties<Core["tables"]["Planet"]["propertiesSchema"]> };

export const EmpireEnumToBg: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600/30",
  [EEmpire.Green]: "bg-green-600/30",
  [EEmpire.Red]: "bg-red-600/30",
  [EEmpire.LENGTH]: "",
};

// TODO: display the number of wallets holding points?
export const EmpireSummary = ({ empireId, ownedPlanets }: { empireId: EEmpire; ownedPlanets: Planet[] }) => {
  const {
    tables,
    utils: { weiToUsd },
  } = useCore();
  const { price: ethPrice, loading: loadingEthPrice } = useEthPrice();
  const { price: sellPrice } = usePointPrice(empireId, 1);
  const sellPriceUsd = weiToUsd(sellPrice, ethPrice ?? 0);
  const empire = tables.Empire.useWithKeys({ id: empireId })!;

  const totalOwnedAssets = ownedPlanets.reduce(
    (acc, planet) => {
      if (planet.properties.empireId !== empireId) return acc;

      acc.gold += planet.properties.goldCount;
      acc.ships += planet.properties.shipCount;
      // TODO(shields): uncomment when implemented
      // acc.shields += planet.properties.shieldCount;
      return acc;
    },
    { gold: BigInt(0), ships: BigInt(0), shields: BigInt(0) },
  );

  if (loadingEthPrice) return <span>loading...</span>;
  return (
    <Card noDecor className={cn(EmpireEnumToBg[empireId], "border-none")}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-8">
        <img src={EmpireToEmpireSprites[empireId]} width={64} height={64} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-300">{EmpireEnumToName[empireId]}</h3>
            <Badge variant="glass">{formatEther(empire.pointsIssued)} points issued</Badge>
          </div>
          <Badge variant={sellPrice ? "secondary" : "warning"} className="flex items-center gap-2">
            {sellPrice ? `sell ${sellPriceUsd} (${formatEther(sellPrice)} ETH)` : "can't sell"}
          </Badge>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <RocketLaunchIcon className="size-4" />
            {totalOwnedAssets.ships.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-4" /> {totalOwnedAssets.shields.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <CurrencyYenIcon className="size-4" /> {totalOwnedAssets.gold.toLocaleString()}
          </div>
        </div>
      </div>
    </Card>
  );
};
