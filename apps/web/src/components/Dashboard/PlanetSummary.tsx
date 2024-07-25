import {
  ChevronLeftIcon,
  CurrencyYenIcon,
  MinusIcon,
  PlusIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { EPlayerAction } from "@primodiumxyz/contracts/config/enums";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useActionCost } from "@/hooks/useActionCost";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useGame } from "@/hooks/useGame";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { EmpireEnumToName } from "@/util/lookups";

/* --------------------------------- PLANET --------------------------------- */
export const PlanetSummary = ({ entity, back }: { entity: Entity; back: () => void }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const planet = tables.Planet.use(entity)!;
  const { empireId, goldCount, shieldCount, shipCount } = planet;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-300">{entityToPlanetName(entity)}</h2>
        <Button variant="primary" className="flex w-fit items-center gap-2" onClick={back}>
          <ChevronLeftIcon className="size-4" />
          back
        </Button>
      </div>
      <img
        src={sprite.getSprite(EmpireToPlanetSpriteKeys[empireId as EEmpire] ?? "PlanetGrey")}
        width={64}
        height={64}
        className="my-2 self-center"
      />
      <div className="grid w-[80%] grid-cols-[1fr_auto_3rem] items-center gap-y-4 self-center">
        {empireId ? (
          <>
            <h3 className="font-semibold text-gray-300">controlled by</h3>
            <span className="justify-self-end">{EmpireEnumToName[empireId as EEmpire]} empire</span>
            <img
              src={sprite.getSprite(EmpireToPlanetSpriteKeys[empireId as EEmpire] ?? "PlanetGrey")}
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
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();

  const planet = tables.Planet.use(entity)!;
  const { empireId, shipCount, shieldCount } = planet;

  const addShipPriceWei = useActionCost(EPlayerAction.CreateShip, empireId, 1n);
  const removeShipPriceWei = useActionCost(EPlayerAction.KillShip, empireId, 1n);
  const addShieldPriceWei = useActionCost(EPlayerAction.ChargeShield, empireId, 1n);
  const removeShieldPriceWei = useActionCost(EPlayerAction.DrainShield, empireId, 1n);

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
            <Button
              variant="neutral"
              size="xs"
              onClick={() => addShield(entity, addShieldPriceWei)}
              disabled={gameOver}
            >
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
            <Button
              variant="neutral"
              size="xs"
              onClick={() => removeShield(entity, removeShieldPriceWei)}
              disabled={gameOver || !shieldCount}
            >
              Buy
            </Button>
          </TransactionQueueMask>
        </div>
      </SecondaryCard>
    </>
  );
};
