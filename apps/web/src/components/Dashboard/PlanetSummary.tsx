import { Fragment } from "react/jsx-runtime";
import {
  ChevronLeftIcon,
  CurrencyYenIcon,
  MinusIcon,
  PlusIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

import { EEmpire } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Price } from "@/components/shared/Price";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { EmpireEnumToName } from "@/util/lookups";

/* --------------------------------- PLANET --------------------------------- */
export const PlanetSummary = ({ entity, back }: { entity: Entity; back: () => void }) => {
  const { tables, utils } = useCore();
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
      {!!empireId && (
        <>
          <PlanetQuickOverrides entity={entity} />
          <RoutineProbabilities entity={entity} />
        </>
      )}
    </>
  );
};

/* --------------------------------- ACTIONS -------------------------------- */
const PlanetQuickOverrides = ({ entity }: { entity: Entity }) => {
  const { tables } = useCore();
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();

  const planet = tables.Planet.use(entity)!;
  const { empireId, shipCount, shieldCount } = planet;

  const addShipPriceWei = useOverrideCost(EOverride.CreateShip, empireId, 1n);
  const removeShipPriceWei = useOverrideCost(EOverride.KillShip, empireId, 1n);
  const addShieldPriceWei = useOverrideCost(EOverride.ChargeShield, empireId, 1n);
  const removeShieldPriceWei = useOverrideCost(EOverride.DrainShield, empireId, 1n);

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
          <span className="flex items-center gap-1">
            <Price wei={addShipPriceWei} />
          </span>
          <TransactionQueueMask id={`${entity}-create-ship`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => createShip(entity, 1n, addShipPriceWei)}
              disabled={gameOver}
            >
              Buy
            </Button>
          </TransactionQueueMask>
          <div className="flex items-center gap-1">
            <RocketLaunchIcon className="size-4" />
            <MinusIcon className="size-4" />
          </div>
          <span className="flex items-center">withdraw ship</span>
          <span className="flex items-center">
            <Price wei={removeShipPriceWei} />
          </span>
          <TransactionQueueMask id={`${entity}-kill-ship`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => removeShip(entity, 1n, removeShipPriceWei)}
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
            <Price wei={addShieldPriceWei} />
          </span>
          <TransactionQueueMask id={`${entity}-add-shield`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => addShield(entity, 1n, addShieldPriceWei)}
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
            <Price wei={removeShieldPriceWei} />
          </span>
          <TransactionQueueMask id={`${entity}-remove-shield`}>
            <Button
              variant="neutral"
              size="xs"
              onClick={() => removeShield(entity, 1n, removeShieldPriceWei)}
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

const RoutineProbabilities = ({ entity }: { entity: Entity }) => {
  const { utils } = useCore();
  const { context, probabilities: p } = utils.getRoutineProbabilities(entity);

  const valToText = (val: number) => {
    if (val >= 1) return "High";
    if (val >= 0) return "Med";
    return "Low";
  };
  return (
    <>
      <h2 className="mt-2 text-sm font-semibold text-gray-300">Routine Probabilities</h2>
      <div>
        <p>Decision Context</p>
        <div className="grid w-full grid-cols-2 gap-1 text-xs">
          <Badge className="w-full gap-2 py-2" tooltip="Is it Under attack?" tooltipDirection="top">
            <span>At Risk</span>
            <p className="rounded bg-accent px-1 text-neutral">{valToText(context.vulnerability)}</p>
          </Badge>
          <Badge className="w-full gap-2 py-2" tooltip="Does it own more ships than neighbors?" tooltipDirection="top">
            <span>Planet Strength</span>
            <p className="rounded bg-accent px-1 text-neutral">{valToText(context.planetStrength)}</p>
          </Badge>
          <Badge className="w-full gap-2 py-2" tooltip="Does empire control the most planets?">
            <span>Empire Strength</span>
            <p className="rounded bg-accent px-1 text-neutral">{valToText(context.empireStrength)}</p>
          </Badge>
        </div>
      </div>
      <SecondaryCard className="bg-gray-900/40">
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: "Accumulate Gold", value: p.accumulateGold },
            { label: "Buy Shields", value: p.buyShields },
            { label: "Buy Ships", value: p.buyShips },
            { label: "Support Ally", value: p.supportAlly },
            { label: "Attack Enemy", value: p.attackEnemy },
          ].map(({ label, value }) => (
            <Fragment key={label}>
              <span className="text-gray-200">{label}</span>
              <span className="text-right font-medium">{(value * 100).toFixed(1)}%</span>
            </Fragment>
          ))}
        </div>
      </SecondaryCard>
    </>
  );
};
