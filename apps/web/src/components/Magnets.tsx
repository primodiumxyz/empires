import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { cn } from "@/util/client";

const MagnetBadge: React.FC<{ turnsLeft: number; className: string }> = ({ turnsLeft, className }) => (
  <Badge className={cn("gap-1 rounded-md py-4", className)}>
    <img src={InterfaceIcons.Crosshairs} className="w-6 rounded-full bg-white/70" /> ({turnsLeft})
  </Badge>
);

const calculateTurnsLeft = (endTurn: bigint | undefined, globalTurn: bigint, beforeEmpire: boolean) => {
  if (!endTurn) return 0;
  const turnsLeft = Number(endTurn - globalTurn);
  return beforeEmpire ? turnsLeft + 1 : turnsLeft;
};

export const Magnets: React.FC<{ planetId: Entity }> = ({ planetId }) => {
  const { tables } = useCore();
  const redMagnet = tables.Magnet.useWithKeys({ empireId: EEmpire.Red, planetId });
  const blueMagnet = tables.Magnet.useWithKeys({ empireId: EEmpire.Blue, planetId });
  const greenMagnet = tables.Magnet.useWithKeys({ empireId: EEmpire.Green, planetId });

  const currTurn = tables.Turn.use()?.value ?? 0n;
  const globalTurn = (currTurn - 1n) / 3n;
  const turnModulo = Number(currTurn - 1n) % 3;

  if (!redMagnet && !blueMagnet && !greenMagnet) return null;

  const redTurnsLeft = calculateTurnsLeft(redMagnet?.endTurn, globalTurn, turnModulo < EEmpire.Red);
  const blueTurnsLeft = calculateTurnsLeft(blueMagnet?.endTurn, globalTurn, turnModulo < EEmpire.Blue);
  const greenTurnsLeft = calculateTurnsLeft(greenMagnet?.endTurn, globalTurn, turnModulo < EEmpire.Green);

  return (
    <div className="absolute right-0 top-0 text-xs text-white">
      {redMagnet && <MagnetBadge turnsLeft={redTurnsLeft} className="bg-error" />}
      {blueMagnet && <MagnetBadge turnsLeft={blueTurnsLeft} className="bg-accent text-neutral" />}
      {greenMagnet && <MagnetBadge turnsLeft={greenTurnsLeft} className="bg-success" />}
    </div>
  );
};
