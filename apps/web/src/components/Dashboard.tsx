import { useState } from "react";
import {
  ChevronLeftIcon,
  CurrencyYenIcon,
  MinusIcon,
  PlusIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { Core, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToFactionSprites } from "@primodiumxyz/game";
import { Entity, Properties } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card, GlassCard, SecondaryCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Tabs } from "@/components/core/Tabs";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePointPrice } from "@/hooks/usePointPrice";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

type Planet = { entity: Entity; properties: Properties<Core["tables"]["Planet"]["propertiesSchema"]> };

export const EmpireEnumToBg: Record<EEmpire, string> = {
  [EEmpire.Blue]: "bg-blue-600/30",
  [EEmpire.Green]: "bg-green-600/30",
  [EEmpire.Red]: "bg-red-600/30",
  [EEmpire.LENGTH]: "",
};

export const EmpireEnumToBorder: Record<EEmpire, string> = {
  [EEmpire.Blue]: "border border-blue-600",
  [EEmpire.Green]: "border border-green-600",
  [EEmpire.Red]: "border border-red-600",
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
            <div className="flex h-screen min-w-[400px] flex-col gap-4 px-2 py-4 text-xs">
              <DashboardPane />
            </div>
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
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | undefined>(undefined);

  if (selectedPlanet) return <PlanetSummary planet={selectedPlanet} back={() => setSelectedPlanet(undefined)} />;

  return (
    <>
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
      <div className="flex flex-col gap-2">
        {planets.map((planet) => {
          const {
            entity,
            properties: { factionId },
          } = planet;
          return (
            <Button
              key={entity}
              variant="neutral"
              className={cn(
                "flex h-14 items-center justify-start gap-4",
                factionId ? EmpireEnumToBorder[factionId as EEmpire] : "border-none",
              )}
              onClick={() => setSelectedPlanet(planet)}
            >
              {/* TODO: map to planet image */}
              {/* <img src={EntityToPlanetSprites[planet.entity]} width={32} height={32} /> */}
              <img src={undefined} width={32} height={32} />
              <h3 className="text-sm font-semibold text-gray-300">{entityToPlanetName(entity)}</h3>
              <span>{factionId ? `(${EmpireEnumToName[factionId as EEmpire]})` : "unowned"}</span>
            </Button>
          );
        })}
      </div>
    </>
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
    <Card noDecor className={cn(EmpireEnumToBg[factionId], "border-none")}>
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
        <div className="flex flex-col gap-2">
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
const PlanetSummary = ({ planet, back }: { planet: Planet; back: () => void }) => {
  const {
    entity,
    properties: { factionId, goldCount, /* shieldCount, */ destroyerCount },
  } = planet;
  // TODO(shields): update when implemented
  const shieldCount = BigInt(0);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-300">{entityToPlanetName(entity)}</h2>
        <Button variant="primary" className="flex w-fit items-center gap-2" onClick={back}>
          <ChevronLeftIcon className="size-4" />
          back
        </Button>
      </div>
      {/* TODO: map to planet image */}
      {/* <img src={EntityToPlanetSprites[planet.entity]} width={64} height={64} className="my-2 self-center" /> */}
      <img src={undefined} width={64} height={64} className="my-2 self-center" />
      <div className="grid w-[80%] grid-cols-[1fr_auto_3rem] items-center gap-y-4 self-center">
        {factionId ? (
          <>
            <h3 className="font-semibold text-gray-300">controlled by</h3>
            <span className="justify-self-end">{EmpireEnumToName[factionId as EEmpire]} empire</span>
            <img
              src={EmpireToFactionSprites[factionId as EEmpire]}
              width={32}
              height={32}
              className="justify-self-center"
            />
          </>
        ) : (
          <span className="col-span-3">neutral</span>
        )}
        <h3 className="font-semibold text-gray-300">gold</h3>
        <span className="justify-self-end">{goldCount.toLocaleString()}</span>
        <CurrencyYenIcon className="size-4 justify-self-center" />
        <h3 className="font-semibold text-gray-300">destroyers</h3>
        <span className="justify-self-end">{destroyerCount.toLocaleString()}</span>
        <RocketLaunchIcon className="size-4 justify-self-center" />
        <h3 className="font-semibold text-gray-300">shield</h3>
        <span className="justify-self-end">{shieldCount.toLocaleString()}</span>
        <ShieldCheckIcon className="size-4 justify-self-center" />
        <span>neighbors</span>
        <div className="col-span-2">__clickable neighbors__</div>
      </div>
      {!!factionId && <PlanetQuickActions planet={planet} />}
    </>
  );
};

/* --------------------------------- ACTIONS -------------------------------- */
const PlanetQuickActions = ({ planet }: { planet: Planet }) => {
  const {
    utils: { ethToUSD },
  } = useCore();
  const { price: ethPrice, loading: loadingEthPrice } = useEthPrice();
  const { createDestroyer, removeDestroyer /* addShield, removeShield */ } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const {
    entity,
    properties: { factionId },
  } = planet;

  const addDestroyerPriceWei = useActionCost(EPlayerAction.CreateDestroyer, factionId);
  const removeDestroyerPriceWei = useActionCost(EPlayerAction.KillDestroyer, factionId);
  // TODO(shields): update when implemented
  // const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, factionId);
  // const removeShieldPriceWei = useActionCost(EPlayerAction.DrainShield, factionId);
  const addShieldPriceWei = BigInt(0);
  const removeShieldPriceWei = BigInt(0);
  const addShield = () => {};
  const removeShield = () => {};

  const addDestroyerPriceUsd = ethToUSD(addDestroyerPriceWei, ethPrice ?? 0);
  const removeDestroyerPriceUsd = ethToUSD(removeDestroyerPriceWei, ethPrice ?? 0);
  const addShieldPriceUsd = ethToUSD(addShieldPriceWei, ethPrice ?? 0);
  const removeShieldPriceUsd = ethToUSD(removeShieldPriceWei, ethPrice ?? 0);

  if (loadingEthPrice) return <span>loading...</span>;
  return (
    <>
      <h2 className="mt-2 text-sm font-semibold text-gray-300">Actions</h2>
      <SecondaryCard className="bg-gray-900/40">
        <div className="grid grid-cols-[3rem_1fr_auto_auto] gap-x-4 gap-y-2">
          <div className="flex items-center gap-1">
            <RocketLaunchIcon className="size-4" />
            <PlusIcon className="size-4" />
          </div>
          <span className="flex items-center">deploy destroyer</span>
          <span className="flex items-center">
            {addDestroyerPriceUsd} ({formatEther(addDestroyerPriceWei)} ETH)
          </span>
          <TransactionQueueMask id={`${entity}-create-destroyer`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => createDestroyer(entity, addDestroyerPriceWei)}
              disabled={gameOver}
            >
              Buy
            </Button>
          </TransactionQueueMask>
          <div className="flex items-center gap-1">
            <RocketLaunchIcon className="size-4" />
            <MinusIcon className="size-4" />
          </div>
          <span className="flex items-center">withdraw destroyer</span>
          <span className="flex items-center">
            {removeDestroyerPriceUsd} ({formatEther(removeDestroyerPriceWei)} ETH)
          </span>
          <TransactionQueueMask id={`${entity}-kill-destroyer`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => removeDestroyer(entity, removeDestroyerPriceWei)}
              disabled={gameOver}
            >
              Buy
            </Button>
          </TransactionQueueMask>
          <div className="flex items-center gap-1">
            <ShieldCheckIcon className="size-4" />
            <PlusIcon className="size-4" />
          </div>
          <span className="flex items-center">charge shield</span>
          <span className="flex items-center">
            {addShieldPriceUsd} ({formatEther(addShieldPriceWei)} ETH)
          </span>
          <TransactionQueueMask id={`${entity}-add-shield`}>
            <Button variant="neutral" size="xs" onClick={addShield} disabled={gameOver}>
              Buy
            </Button>
          </TransactionQueueMask>
          <div className="flex items-center gap-1">
            <ShieldCheckIcon className="size-4" />
            <MinusIcon className="size-4" />
          </div>
          <span className="flex items-center">drain shield</span>
          <span className="flex items-center">
            {removeShieldPriceUsd} ({formatEther(removeShieldPriceWei)} ETH)
          </span>
          <TransactionQueueMask id={`${entity}-remove-shield`}>
            <Button variant="neutral" size="xs" onClick={removeShield} disabled={gameOver}>
              Buy
            </Button>
          </TransactionQueueMask>
        </div>
      </SecondaryCard>
    </>
  );
};
