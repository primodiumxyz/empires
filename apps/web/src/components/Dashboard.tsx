import { useState } from "react";
import { CurrencyYenIcon, RocketLaunchIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { Core } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToFactionSprites } from "@primodiumxyz/game";
import { Entity, Properties } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Card, GlassCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Tabs } from "@/components/core/Tabs";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

type Planet = { entity: Entity; properties: Properties<Core["tables"]["Planet"]["propertiesSchema"]> };

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600/30",
  [EEmpire.Green]: "bg-green-600/30",
  [EEmpire.Red]: "bg-red-600/30",
  [EEmpire.LENGTH]: "",
};

/* -------------------------------------------------------------------------- */
/*                                  DASHBOARD                                 */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- PANE ---------------------------------- */
export const Dashboard = () => {
  return (
    <Tabs className="flex items-center" persistIndexKey="dashboard">
      <Tabs.Button
        index={0}
        togglable
        size={"sm"}
        className="pointer-events-auto !z-0 !border-r-0 heropattern-topography-slate-500/10 animate-in fade-in zoom-in"
        style={{
          writingMode: "vertical-rl",
        }}
      >
        <IconLabel
          text="Dashboard"
          imageUri={InterfaceIcons.Navigator}
          className="gap-2 py-4"
          style={{
            writingMode: "vertical-lr",
          }}
        />
      </Tabs.Button>

      <Tabs.Pane index={0} fragment className="pointer-events-auto">
        <GlassCard direction={"left"} className="animate-in slide-in-from-right-full">
          <Card fragment noDecor>
            <DashboardPane />
          </Card>
        </GlassCard>
      </Tabs.Pane>
    </Tabs>
  );
};

/* --------------------------------- CONTENT -------------------------------- */
const DashboardPane = () => {
  const { tables } = useCore();
  const factionPrices = usePointPrice();
  const planets = tables.Planet.useAll().map((entity) => ({ entity, properties: tables.Planet.get(entity)! }));
  const factions = [EEmpire.Red, EEmpire.Green, EEmpire.Blue] as const;
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0]);

  return (
    <div className="flex h-screen min-w-[400px] flex-col gap-4 p-2">
      <h2 className="text-sm font-semibold text-gray-300">Factions</h2>
      <div className="flex flex-col gap-2">
        {factions.map((faction) => (
          <FactionSummary
            key={faction}
            factionId={faction}
            buyPrice={factionPrices.buy[faction] ?? BigInt(0)}
            sellPrice={factionPrices.sell[faction] ?? BigInt(0)}
            ownedPlanets={planets.filter((planet) => planet.properties.factionId === faction)}
          />
        ))}
      </div>
      <h2 className="text-sm font-semibold text-gray-300">Planets</h2>
      <span>- select planet</span>
      <PlanetSummary planet={selectedPlanet} />
      <h2 className="text-sm font-semibold text-gray-300">Quick action (if planet owned)</h2>
      <PlanetQuickActions planet={selectedPlanet} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  SUMMARIES                                 */
/* -------------------------------------------------------------------------- */

/* --------------------------------- FACTION -------------------------------- */
// TODO: display the number of wallets holding points?
const FactionSummary = ({
  factionId,
  buyPrice,
  sellPrice,
  ownedPlanets,
}: {
  factionId: EEmpire;
  buyPrice: bigint;
  sellPrice: bigint;
  ownedPlanets: Planet[];
}) => {
  const {
    tables,
    utils: { ethToUSD },
  } = useCore();
  const { price: ethPrice, loading: loadingEthPrice } = useEthPrice();
  const faction = tables.Faction.useWithKeys({ id: factionId })!;

  const buyPriceUsd = ethToUSD(buyPrice, ethPrice ?? 0);
  const sellPriceUsd = ethToUSD(sellPrice, ethPrice ?? 0);

  const totalOwnedAssets = ownedPlanets.reduce(
    (acc, planet) => {
      if (planet.properties.factionId !== factionId) return acc;

      acc.gold += planet.properties.goldCount;
      acc.destroyers += planet.properties.destroyerCount;
      // TODO(shields): uncomment when implemented
      // acc.shields += planet.properties.shieldCount;
      return acc;
    },
    { gold: BigInt(0), destroyers: BigInt(0), shields: BigInt(0) },
  );

  if (loadingEthPrice) return <span>loading...</span>;
  return (
    <Card noDecor className={cn(EmpireEnumToColor[factionId], "border-none")}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-8">
        <img src={EmpireToFactionSprites[factionId]} width={64} height={64} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-300">{EmpireEnumToName[factionId]}</h3>
            <Badge variant="glass">{formatEther(faction.pointsIssued)} points issued</Badge>
          </div>
          <Badge variant="primary" className="flex items-center gap-2">
            buy {buyPriceUsd} ({formatEther(buyPrice)} ETH)
          </Badge>
          <Badge variant={sellPrice ? "secondary" : "warning"} className="flex items-center gap-2">
            {sellPrice ? `sell ${sellPriceUsd} (${formatEther(sellPrice)} ETH)` : "can't sell"}
          </Badge>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <RocketLaunchIcon className="size-4" />
            {totalOwnedAssets.destroyers.toLocaleString()}
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

/* --------------------------------- PLANET --------------------------------- */
const PlanetSummary = ({ planet }: { planet: Planet }) => {
  return (
    <>
      <span>- faction/unowned</span>
      <span>- destroyers count</span>
      <span>- shields count</span>
      <span>- gold count</span>
      <span>- neighbors</span>
    </>
  );
};

/* --------------------------------- ACTIONS -------------------------------- */
const PlanetQuickActions = ({ planet }: { planet: Planet }) => {
  if (planet.properties.factionId === 0) return <span>planet is neutral</span>;

  return (
    <div className="flex gap-4">
      <button>add destroyer</button>
      <button>remove destroyer</button>
      <button>add shield</button>
      <button>remove shield</button>
    </div>
  );
};
