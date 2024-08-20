import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Price } from "@/components/shared/Price";
import { useContractCalls } from "@/hooks/useContractCalls";
import { usePot } from "@/hooks/usePot";
import useWinningEmpire from "@/hooks/useWinningEmpire";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE, EmpireEnumToConfig } from "@/util/lookups";

export const GameOver = ({ className, fragment = false }: { className?: string; fragment?: boolean }) => {
  const calls = useContractCalls();
  const { tables } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const { pot } = usePot();
  const { empire } = useWinningEmpire();

  const empirePoints = tables.Empire.useWithKeys({ id: empire ?? 0 })?.pointsIssued ?? 0n;
  const playerEmpirePoints =
    tables.Value_PointsMap.useWithKeys({ empireId: empire ?? 0, playerId: entity })?.value ?? 0n;

  const playerPot = empirePoints ? (pot * playerEmpirePoints) / empirePoints : 0n;

  const empireName = EmpireEnumToConfig[empire ?? DEFAULT_EMPIRE].name;
  if (empire == null) return null;

  return (
    <Card fragment={fragment} className={cn("flex flex-col text-center", className)}>
      <p>
        Game over. <span className="font-semibold">{empireName}</span> won!
      </p>
      {playerPot > 0n && (
        <>
          <p>
            You earned <Price wei={playerPot} />!
          </p>
          <Button variant="primary" size="sm" className="col-span-2 mt-1 w-full" onClick={calls.withdrawEarnings}>
            Withdraw
          </Button>
        </>
      )}
      {playerPot === 0n && <p className="col-span-2 text-xs opacity-50">You have no earnings to withdraw.</p>}
    </Card>
  );
};
