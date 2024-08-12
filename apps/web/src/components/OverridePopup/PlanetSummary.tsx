import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { useCharge } from "@/hooks/useCharge";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";

/* --------------------------------- PLANET --------------------------------- */
export const PlanetSummary = ({ entity, className }: { entity: Entity; className?: string }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const planet = tables.Planet.use(entity)!;
  const { empireId } = planet;

  return (
    <Card noDecor className={cn("hide-scrollbar h-fit max-h-full flex-col items-center overflow-y-auto", className)}>
      <div className="mb-2 flex w-full flex-col items-center justify-center gap-4">
        <img
          src={sprite.getSprite(EmpireToPlanetSpriteKeys[empireId as EEmpire] ?? "PlanetGrey")}
          width={64}
          height={64}
        />
        <h2 className="text-sm font-semibold text-warning">{entityToPlanetName(entity)}</h2>
      </div>

      <div className="flex flex-col gap-3">
        <RoutineProbabilities entity={entity} />
        <Overrides entity={entity} />
      </div>
    </Card>
  );
};

const RoutineProbabilities = ({ entity }: { entity: Entity }) => {
  const { utils } = useCore();
  const { context, probabilities: p } = utils.getRoutineProbabilities(entity);

  const valToText = (val: number) => {
    if (val >= 1) return "HIGH";
    if (val >= 0) return "MED";
    return "LOW";
  };

  return (
    <>
      <div className="mb-4 p-2 text-xs">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-gray-400">AT RISK</span>
          <span className="text-right text-cyan-400">{valToText(context.vulnerability)}</span>
          <span className="text-gray-400">PLANET STRENGTH</span>
          <span className="text-right text-cyan-400">{valToText(context.planetStrength)}</span>
          <span className="text-gray-400">EMPIRE STRENGTH</span>
          <span className="text-right text-cyan-400">{valToText(context.empireStrength)}</span>
        </div>
      </div>
      <div className="relative w-full rounded-md border border-base-100 p-2 text-xs">
        <h3 className="absolute left-0 top-0 mb-2 -translate-y-1/2 bg-secondary/25 text-xs">ROUTINE PROBABILITIES</h3>
        <div className="grid grid-cols-2 gap-y-1 text-xs">
          <span>ACCUMULATE GOLD</span>
          <span className="text-right">{(p.accumulateGold * 100).toFixed(0)}%</span>
          <span>BUY SHIPS</span>
          <span className="text-right">{(p.buyShips * 100).toFixed(0)}%</span>
          <span>BUY SHIELDS</span>
          <span className="text-right">{(p.buyShields * 100).toFixed(0)}%</span>
          <span>SUPPORT</span>
          <span className="text-right">{(p.supportAlly * 100).toFixed(0)}%</span>
          <span>ATTACK</span>
          <span className="text-right">{(p.attackEnemy * 100).toFixed(0)}%</span>
        </div>
      </div>
    </>
  );
};

const calculateTurnsLeft = (endTurn: bigint | undefined, globalTurn: bigint, beforeEmpire: boolean) => {
  if (endTurn == undefined) return 0;
  const turnsLeft = Number(endTurn - globalTurn);
  return beforeEmpire ? turnsLeft + 1 : turnsLeft;
};

const Overrides = ({ entity }: { entity: Entity }) => {
  const { utils, tables } = useCore();
  const { context, probabilities: p } = utils.getRoutineProbabilities(entity);
  const overheat = useCharge(entity);
  const empires = useEmpires();
  const time = tables.Time.use();

  const magnets = useMemo(
    () =>
      empires.keys().map((empire) => ({
        endTurn: tables.Magnet.getWithKeys({ empireId: empire, planetId: entity })?.endTurn,
        empire: empire,
      })),
    [empires, entity, time],
  );

  const currTurn = tables.Turn.use()?.value ?? 0n;

  const currFullTurn = (currTurn - 1n) / 3n;
  const turnModulo = Number(currTurn - 1n) % 3;

  const turnsLeft = magnets.reduce<Record<EEmpire, number>>(
    (acc, magnet) => {
      acc[magnet.empire] = calculateTurnsLeft(magnet?.endTurn, currFullTurn, turnModulo < magnet?.empire);
      return acc;
    },
    {} as Record<EEmpire, number>,
  );

  const valToText = (val: number) => {
    if (val >= 1) return "HIGH";
    if (val >= 0) return "MED";
    return "LOW";
  };

  return (
    <>
      <div className="relative w-full rounded-md border border-base-100 p-2 text-xs">
        <h3 className="absolute left-0 top-0 mb-2 -translate-y-1/2 bg-secondary/25 text-xs">OVERRIDES</h3>
        <div className="grid grid-cols-2 gap-y-1 text-xs">
          <span className="text-gray-4000">OVERHEAT</span>
          <span className="text-right">{Math.min(overheat.percent, 100).toFixed(0)}%</span>
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-xs">
          <span className="text-gray-4000">MAGNETS</span>
          <div className="flex flex-row gap-1">
            {empires.entries().map(([empire, data], index) => (
              <IconLabel key={index} imageUri={data.icons.magnet} text={formatNumber(turnsLeft[empire] ?? 0)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
