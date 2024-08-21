import { Fragment, useEffect, useMemo, useState } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName, formatNumber, formatTime } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { useGame } from "@/hooks/useGame";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";
import { useTimeSinceTurnStart } from "@/hooks/useTimeSinceTurnStart";
import { cn } from "@/util/client";

/* --------------------------------- PLANET --------------------------------- */
export const PlanetSummary = ({ entity, className }: { entity: Entity; className?: string }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const planet = tables.Planet.use(entity)!;
  const hasShieldEater = tables.ShieldEater.use()?.currentPlanet === entity;
  const { empireId } = planet;

  return (
    <Card noDecor className={cn("hide-scrollbar h-fit max-h-full min-w-80 overflow-y-auto", className)}>
      <div className="flex w-full flex-col items-center gap-4">
        <div className="mb-2 mt-4 flex w-full flex-col items-center justify-center gap-4">
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={sprite.getSprite(EmpireToPlanetSpriteKeys[empireId as EEmpire] ?? "PlanetGrey")}
              width={64}
              height={64}
            />
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
                className={cn("absolute top-0", hasShieldEater ? "right-[20%]" : "right-[28%]")}
              />
            )}
          </div>
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-sm font-semibold text-warning">{entityToPlanetName(entity)}</h2>
            <span className="text-xs text-gray-400">
              [{planet.q.toLocaleString()}, {planet.r.toLocaleString()}]
            </span>
            <PlanetAssets shipCount={planet.shipCount} shieldCount={planet.shieldCount} goldCount={planet.goldCount} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-6">
          <Overrides entity={entity} />
          <RoutineProbabilities entity={entity} />
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
  const probabilities = useMemo(() => {
    return {
      accumulateGold: { label: "ACCUMULATE GOLD", value: p.accumulateGold },
      buyShips: { label: "BUY SHIPS", value: p.buyShips },
      buyShields: { label: "BUY SHIELDS", value: p.buyShields },
      supportAlly: { label: "SUPPORT", value: p.supportAlly },
      attackEnemy: { label: "ATTACK", value: p.attackEnemy },
    };
  }, [p]);

  return (
    <div className="relative w-full rounded-md border border-base-100 p-2 text-xs">
      <h3 className="absolute left-0 top-0 mb-2 -translate-y-1/2 bg-secondary/25 text-xs">ROUTINE PROBABILITIES</h3>
      <div className="grid grid-cols-2 gap-y-1 text-xs">
        {Object.entries(probabilities)
          .sort((a, b) => b[1].value - a[1].value)
          .map(([key, { label, value }]) => (
            <Fragment key={key}>
              <span>{label}</span>
              <span className="text-right">{(value * 100).toFixed(0)}%</span>
            </Fragment>
          ))}
      </div>
    </div>
  );
};

const Overrides = ({ entity }: { entity: Entity }) => {
  const {
    tables,
    utils: { getShieldEaterPath },
  } = useCore();
  const turnLengthBlocks = tables.P_GameConfig.use()?.turnLengthBlocks ?? 1n;
  const avgBlockTime = tables.BlockNumber.use()?.avgBlockTime ?? 1;

  const magnets = usePlanetMagnets(entity);
  const timeElapsedSinceTurnStart = useTimeSinceTurnStart();
  const [timeLeft, setTimeLeft] = useState<number[]>(magnets.map(() => 0));

  useEffect(() => {
    const calculateTimeLeft = () => {
      const currTurn = tables.Turn.get()?.value ?? 1n;
      const newTimeLeft = magnets.map((magnet) => {
        if (magnet.endTurn !== undefined) {
          const turnsLeft = Number(magnet.endTurn - currTurn);
          const secondsLeft = turnsLeft * Number(turnLengthBlocks) * avgBlockTime - timeElapsedSinceTurnStart;
          return Math.max(0, secondsLeft);
        } else {
          return 0;
        }
      });

      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
  }, [magnets, turnLengthBlocks, avgBlockTime, timeElapsedSinceTurnStart]);

  const shieldEater = tables.ShieldEater.use();
  const turnsToShieldEater = useMemo(() => {
    if (!shieldEater) return undefined;
    if (shieldEater.currentPlanet === entity) return 0;
    const path = getShieldEaterPath(shieldEater.currentPlanet as Entity, shieldEater.destinationPlanet as Entity);
    const index = path.indexOf(entity);
    return index === -1 ? undefined : index + 1;
  }, [shieldEater, entity]);

  return (
    <div className="relative w-full rounded-md border border-base-100 p-2 text-xs">
      <h3 className="absolute left-0 top-0 mb-2 -translate-y-1/2 bg-secondary/25 text-xs">OVERRIDES</h3>
      <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1 text-xs">
        <span className="text-gray-400">MAGNETS</span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1">
          {magnets.map((magnet, index) => (
            <IconLabel
              key={index}
              imageUri={magnet.icon}
              text={timeLeft[index] ? formatTime(timeLeft[index], true) : "--"}
            />
          ))}
        </div>
        <span className="text-gray-400">SHIELD EATER</span>
        <div>
          {turnsToShieldEater === 0 && <span className="text-accent">on planet</span>}
          {!!turnsToShieldEater && (
            <span className="text-accent">
              in {turnsToShieldEater} turn{turnsToShieldEater > 1 ? "s" : ""}
            </span>
          )}
          {turnsToShieldEater === undefined && "not on path"}
        </div>
      </div>
    </div>
  );
};
