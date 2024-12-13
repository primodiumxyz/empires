import { useState } from "react";

import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Card, GlassCard } from "@/components/core/Card";
import { Price } from "@/components/shared/Price";
import { useContractCalls } from "@/hooks/useContractCalls";
import { usePot } from "@/hooks/usePot";
import useWinningEmpire from "@/hooks/useWinningEmpire";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE, EmpireEnumToConfig } from "@/util/lookups";

export const GameOver = ({ className }: { className?: string }) => {
  const { empire } = useWinningEmpire();
  const [closed, setClosed] = useState(false);

  const { playerAccount } = usePlayerAccount();

  const empireName = EmpireEnumToConfig[empire ?? DEFAULT_EMPIRE].name;
  if (empire == null || closed) return null;

  return (
    <GlassCard className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
      <Card noDecor className={cn("flex min-w-[300px] flex-col !bg-opacity-100 text-center", className)}>
        <Button
          variant="ghost"
          size="xs"
          shape="square"
          className="absolute right-0 top-0"
          onClick={() => setClosed(true)}
        >
          X
        </Button>
        <p className="lg:text-xl">
          Game over. <span className="font-semibold">{empireName}</span> won!
        </p>
        {playerAccount && <PlayerPot entity={playerAccount.entity} />}
      </Card>
    </GlassCard>
  );
};

const PlayerPot = ({ entity }: { entity: Entity }) => {
  const handleClick = () => {
    window.open('/payman', '_blank', 'rel=noreferrer');
  };

  const { empire } = useWinningEmpire();
  const { tables } = useCore();
  const { pot } = usePot();
  const calls = useContractCalls();
  const playerEmpirePoints =
    tables.Value_PointsMap.useWithKeys({ empireId: empire ?? 0, playerId: entity })?.value ?? 0n;

  const empirePoints = tables.Empire.useWithKeys({ id: empire ?? 0 })?.pointsIssued ?? 0n;
  const playerPot = empirePoints ? (pot * playerEmpirePoints) / empirePoints : 0n;

  if (playerPot > 0n)
    return (
      <>
        <p>
          You earned <Price wei={playerPot} />!
        </p>
        <Button variant="primary" size="sm" className="col-span-2 mt-1 w-full" onClick={handleClick}>
          Withdraw
        </Button>
      </>
    );
  if (playerPot === 0n) return <p className="col-span-2 text-xs opacity-50">You have no earnings to withdraw.</p>;
};
