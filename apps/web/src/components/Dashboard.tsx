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
import { EmpireToEmpireSprites } from "@primodiumxyz/game";
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
  const planets = tables.Planet.useAll().map((entity) => ({ entity, properties: tables.Planet.get(entity)! }));
  const selectedPlanet = tables.SelectedPlanet.use();
  const empires = [EEmpire.Red, EEmpire.Green, EEmpire.Blue] as const;

  if (selectedPlanet) return <PlanetSummary entity={selectedPlanet.value} back={() => tables.SelectedPlanet.clear()} />;

  return (
    <>
      <h2 className="text-sm font-semibold text-gray-300">Empires</h2>
      <div className="flex flex-col gap-2">
        {empires.map((empire) => (
          <EmpireSummary
            key={empire}
            empireId={empire}
            ownedPlanets={planets.filter((planet) => planet.properties.empireId === empire)}
          />
        ))}
      </div>
      <h2 className="text-sm font-semibold text-gray-300">Planets</h2>
      <div className="flex flex-col gap-2">
        {planets.map((planet) => {
          const {
            entity,
            properties: { empireId },
          } = planet;

          return (
            <Button
              key={entity}
              variant="neutral"
              className={cn(
                "flex h-14 items-center justify-start gap-4",
                empireId ? EmpireEnumToBorder[empireId as EEmpire] : "border-none",
              )}
              onClick={() => tables.SelectedPlanet.set({ value: entity })}
            >
              {/* TODO: map to planet image */}
              {/* <img src={EntityToPlanetSprites[planet.entity]} width={32} height={32} /> */}
              <img src={undefined} width={32} height={32} />
              <h3 className="text-sm font-semibold text-gray-300">{entityToPlanetName(entity)}</h3>
              <span>{empireId ? `(${EmpireEnumToName[empireId as EEmpire]})` : "unowned"}</span>
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

/* --------------------------------- EMPIRE --------------------------------- */
// TODO: display the number of wallets holding points?
const EmpireSummary = ({ empireId, ownedPlanets }: { empireId: EEmpire; ownedPlanets: Planet[] }) => {
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

/* --------------------------------- PLANET --------------------------------- */
const PlanetSummary = ({ entity, back }: { entity: Entity; back: () => void }) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(entity)!;
  const { empireId, goldCount, /* shieldCount, */ shipCount } = planet;
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
        {empireId ? (
          <>
            <h3 className="font-semibold text-gray-300">controlled by</h3>
            <span className="justify-self-end">{EmpireEnumToName[empireId as EEmpire]} empire</span>
            <img
              src={EmpireToEmpireSprites[empireId as EEmpire]}
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
        <h3 className="font-semibold text-gray-300">ships</h3>
        <span className="justify-self-end">{shipCount.toLocaleString()}</span>
        <RocketLaunchIcon className="size-4 justify-self-center" />
        <h3 className="font-semibold text-gray-300">shield</h3>
        <span className="justify-self-end">{shieldCount.toLocaleString()}</span>
        <ShieldCheckIcon className="size-4 justify-self-center" />
        <span>neighbors</span>
        <div className="col-span-2">__clickable neighbors__</div>
      </div>
      {!!empireId && <PlanetQuickActions entity={entity} />}
    </>
  );
};

/* --------------------------------- ACTIONS -------------------------------- */
const PlanetQuickActions = ({ entity }: { entity: Entity }) => {
  const {
    tables,
    utils: { weiToUsd },
  } = useCore();
  const { price: ethPrice, loading: loadingEthPrice } = useEthPrice();
  const { createShip, removeShip /* addShield, removeShield */ } = useContractCalls();
  const { gameOver } = useTimeLeft();

  const planet = tables.Planet.use(entity)!;
  const { empireId, shipCount /* , shieldCount */ } = planet;

  const addShipPriceWei = useActionCost(EPlayerAction.CreateShip, empireId);
  const removeShipPriceWei = useActionCost(EPlayerAction.KillShip, empireId);
  // TODO(shields): update when implemented
  // const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, empireId);
  // const removeShieldPriceWei = useActionCost(EPlayerAction.DrainShield, empireId);
  const shieldCount = BigInt(0);
  const addShieldPriceWei = BigInt(0);
  const removeShieldPriceWei = BigInt(0);
  const addShield = () => {};
  const removeShield = () => {};

  const addShipPriceUsd = weiToUsd(addShipPriceWei, ethPrice ?? 0);
  const removeShipPriceUsd = weiToUsd(removeShipPriceWei, ethPrice ?? 0);
  const addShieldPriceUsd = weiToUsd(addShieldPriceWei, ethPrice ?? 0);
  const removeShieldPriceUsd = weiToUsd(removeShieldPriceWei, ethPrice ?? 0);

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
          <span className="flex items-center">deploy ship</span>
          <span className="flex items-center">
            {addShipPriceUsd} ({formatEther(addShipPriceWei)} ETH)
          </span>
          <TransactionQueueMask id={`${entity}-create-ship`}>
            <Button variant="neutral" size="xs" onClick={() => createShip(entity, addShipPriceWei)} disabled={gameOver}>
              Buy
            </Button>
          </TransactionQueueMask>
          <div className="flex items-center gap-1">
            <RocketLaunchIcon className="size-4" />
            <MinusIcon className="size-4" />
          </div>
          <span className="flex items-center">withdraw ship</span>
          <span className="flex items-center">
            {removeShipPriceUsd} ({formatEther(removeShipPriceWei)} ETH)
          </span>
          <TransactionQueueMask id={`${entity}-kill-ship`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => removeShip(entity, removeShipPriceWei)}
              disabled={gameOver || !shipCount}
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
            <Button variant="neutral" size="xs" onClick={removeShield} disabled={gameOver || !shieldCount}>
              Buy
            </Button>
          </TransactionQueueMask>
        </div>
      </SecondaryCard>
    </>
  );
};
