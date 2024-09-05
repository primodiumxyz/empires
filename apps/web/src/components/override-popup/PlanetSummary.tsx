import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { EmpireLogo } from "@/components/shared/EmpireLogo";
import { useAcidRain } from "@/hooks/useAcidRain";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";
import { usePlanetName } from "@/hooks/usePlanetName";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

/* --------------------------------- PLANET --------------------------------- */
export const PlanetSummary = ({ entity, className }: { entity: Entity; className?: string }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const planet = tables.Planet.use(entity)!;
  const hasShieldEater = tables.ShieldEater.use()?.currentPlanet === entity;
  const { cycles } = useAcidRain(entity, planet.empireId);
  const hasAcidRain = cycles > 0n;
  const { empireId } = planet as { empireId: EEmpire };
  const planetName = usePlanetName(entity);
  const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empireId] ?? "PlanetGrey");

  const moveCrown = [EEmpire.Purple, EEmpire.Pink, EEmpire.Yellow].includes(empireId);

  return (
    <Card noDecor className={cn("hide-scrollbar relative h-fit max-h-full min-w-80 overflow-y-auto", className)}>
      <div className="flex w-full flex-col items-center gap-4">
        <div className="mb-2 mt-4 flex w-full flex-col items-center justify-center gap-4">
          <div className="relative flex h-full w-full items-center justify-center">
            <img src={spriteUrl} width={64} height={64} />
            <img
              src={sprite.getSprite("ShieldEater")}
              width={116}
              height={116}
              className={cn(
                "absolute left-[52%] top-[41%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity",
                hasShieldEater && "opacity-100",
              )}
            />
            {planet.isCitadel && (
              <img
                src={sprite.getSprite("Crown")}
                width={24}
                height={24}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 scale-[150%]",
                  hasShieldEater || moveCrown ? "-top-4" : "top-0",
                )}
              />
            )}
            {hasAcidRain && (
              <img
                src={sprite.getSprite("AcidRain")}
                width={132}
                height={132}
                className={cn(
                  "absolute left-[50%] top-[45%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity",
                  hasAcidRain && "opacity-100",
                )}
              />
            )}
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1">
              <h2 className="text-base font-semibold text-warning">{planetName}</h2>
              <EmpireLogo empireId={empireId} size="xs" />
            </div>
            <p className="flex items-center gap-1 text-xs text-gray-400">
              [{(planet.q - 100n).toLocaleString()}, {planet.r.toLocaleString()}]
            </p>

            <PlanetAssets shipCount={planet.shipCount} shieldCount={planet.shieldCount} goldCount={planet.goldCount} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-6">
          <Overrides entity={entity} />
          {empireId !== EEmpire.NULL && <RoutineProbabilities entity={entity} />}
        </div>
      </div>
    </Card>
  );
};

const PlanetAssets = ({
  shipCount,
  shieldCount,
  goldCount,
}: {
  shipCount: bigint;
  shieldCount: bigint;
  goldCount: bigint;
}) => {
  const {
    ROOT: { sprite },
  } = useGame();

  return (
    <div className="mt-1 flex gap-2">
      <IconLabel imageUri={sprite.getSprite("Ship")} text={formatNumber(shipCount, { showZero: true })} />
      <IconLabel imageUri={sprite.getSprite("Shield")} text={formatNumber(shieldCount, { showZero: true })} />
      <IconLabel imageUri={sprite.getSprite("Gold")} text={formatNumber(goldCount, { showZero: true })} />
    </div>
  );
};

const RoutineProbabilities = ({ entity }: { entity: Entity }) => {
  const { utils } = useCore();
  const { probabilities: p } = utils.getRoutineProbabilities(entity);
  const { OpenRoutineProbabilities } = useSettings();
  const isOpen = OpenRoutineProbabilities.use()?.value ?? false;

  const probabilities = useMemo(() => {
    return {
      accumulateGold: { label: "ACCUMULATE GOLD", value: p.accumulateGold },
      buyShips: { label: "BUY SHIPS", value: p.buyShips },
      buyShields: { label: "BUY SHIELDS", value: p.buyShields },
      moveShips: { label: "MOVE SHIPS", value: p.moveShips },
    };
  }, [p]);

  return (
    <div className="relative min-h-8 w-full rounded-md border border-base-100 p-2 text-xs">
      <button
        onClick={() => OpenRoutineProbabilities.set({ value: !isOpen })}
        className="absolute left-2 top-0 mb-2 flex -translate-y-1/2 items-center bg-secondary/25 text-left"
      >
        <h3 className="text-xs">ROUTINE LIKELIHOODS</h3>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="grid grid-cols-2 gap-y-1 p-2 text-xs">
          {Object.entries(probabilities)
            .sort((a, b) => b[1].value - a[1].value)
            .map(([key, { label, value }]) => (
              <Fragment key={key}>
                <span>{label}</span>
                <span className="text-right">{(value * 100).toFixed(0)}%</span>
              </Fragment>
            ))}
        </div>
      )}
    </div>
  );
};

const Overrides = ({ entity }: { entity: Entity }) => {
  const {
    tables,
    utils: { getShieldEaterPath },
  } = useCore();

  const planet = tables.Planet.use(entity)!;
  const { cycles } = useAcidRain(entity, planet.empireId);
  const magnets = usePlanetMagnets(entity);
  const currTurn = tables.Turn.use()?.value ?? 1n;
  const [turnsLeft, setTurnsLeft] = useState<number[]>(magnets.map(() => 0));
  const empireCount = useEmpires().size;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const newTurnsLeft = magnets.map((magnet) => {
        if (magnet.endTurn !== undefined) {
          const turns = Number(magnet.endTurn - currTurn);
          const turnLeft = Math.ceil(turns / empireCount);
          return turnLeft;
        } else {
          return 0;
        }
      });

      setTurnsLeft(newTurnsLeft);
    };

    calculateTimeLeft();
  }, [magnets, currTurn]);

  const shieldEater = tables.ShieldEater.use();
  const turnsToShieldEater = useMemo(() => {
    if (!shieldEater) return undefined;
    if (shieldEater.currentPlanet === entity) return 0;
    const path = getShieldEaterPath(shieldEater.currentPlanet as Entity, shieldEater.destinationPlanet as Entity);
    const index = path.indexOf(entity);
    return index === -1 ? undefined : index + 1;
  }, [shieldEater, entity]);

  return (
    <div className="relative min-h-8 w-full rounded-md border border-base-100 p-2 text-xs">
      <h3 className="absolute left-2 top-0 mb-2 -translate-y-1/2 bg-secondary/25 text-xs">OVERRIDES</h3>
      <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1 text-xs">
        <span className="mt-1 text-gray-400">MAGNETS</span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1">
          {magnets.length > 0 && turnsLeft.some((t) => t !== 0) ? (
            magnets.map(
              (magnet, index) =>
                turnsLeft[index] !== 0 && (
                  <IconLabel
                    key={index}
                    imageUri={magnet.icon}
                    text={turnsLeft[index] ? formatNumber(turnsLeft[index]) : "--"}
                  />
                ),
            )
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>

        <span className="text-gray-400">SHIELD EATER</span>
        <div>
          {turnsToShieldEater !== undefined ? (
            turnsToShieldEater === 0 ? (
              <span className="text-accent">on planet</span>
            ) : (
              <span className="text-accent">
                in {turnsToShieldEater} turn{turnsToShieldEater > 1 ? "s" : ""}
              </span>
            )
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>

        <span className="text-gray-400">ACID RAIN</span>
        <div>
          {cycles !== 0n ? (
            <span className="text-accent">
              {cycles.toLocaleString()} turn{cycles > 1n ? "s" : ""} left
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      </div>
    </div>
  );
};
