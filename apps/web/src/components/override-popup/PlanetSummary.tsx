import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName, formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { usePlanetMagnets } from "@/hooks/usePlanetMagnets";
import { cn } from "@/util/client";

/* --------------------------------- PLANET --------------------------------- */
export const PlanetSummary = ({ entity, className }: { entity: Entity; className?: string }) => {
  const { tables } = useCore();
  const {
    ROOT: { sprite },
  } = useGame();
  const planet = tables.Planet.use(entity)!;
  const hasShieldEater = tables.ShieldEater.use(entity)?.currentPlanet === entity;
  const { empireId } = planet;

  return (
    <Card noDecor className={cn("hide-scrollbar h-fit max-h-full flex-col items-center overflow-y-auto", className)}>
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
  const { tables } = useCore();
  const empires = useEmpires();

  const magnets = usePlanetMagnets(entity);

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

  return (
    <div className="relative w-full rounded-md border border-base-100 p-2 text-xs">
      <h3 className="absolute left-0 top-0 mb-2 -translate-y-1/2 bg-secondary/25 text-xs">OVERRIDES</h3>
      <div className="grid grid-cols-2 gap-y-1 text-xs">
        <span className="text-gray-4000">MAGNETS</span>
        <div className="flex flex-row gap-1">
          {empires.entries().map(([empire, data], index) => (
            <IconLabel key={index} imageUri={data.icons.magnet} text={formatNumber(turnsLeft[empire] ?? 0)} />
          ))}
        </div>
      </div>
    </div>
  );
};
