import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatTime } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Tooltip } from "@/components/core/Tooltip";
import { Price } from "@/components/shared/Price";
import { useContractCalls } from "@/hooks/useContractCalls";
import { usePot } from "@/hooks/usePot";
import { useSettings } from "@/hooks/useSettings";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { EmpireEnumToName } from "@/util/lookups";

export const TimeLeft = () => {
  const { timeLeftMs, blocksLeft, gameOver } = useTimeLeft();
  const { showBlockchainUnits } = useSettings();
  const { tables } = useCore();

  const endTime = useMemo(() => {
    return new Date(Date.now() + (timeLeftMs ?? 0));
  }, [timeLeftMs]);
  const turn = tables.Turn.use();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  const avgBlockTime = tables.BlockNumber.use()?.avgBlockTime ?? 0;

  const timeLeft = formatTime(
    Math.max(0, Number(turn?.nextTurnBlock ?? 0n) - Number(blockNumber)) * Number(avgBlockTime),
  );
  if (!turn) return null;

  return (
    <div className="flex w-72 flex-col justify-center gap-1 rounded p-4 text-center">
      {gameOver && <GameOver />}
      {!gameOver && (
        <Card className="py-2 text-sm" noDecor>
          <div className="flex flex-col">
            <Tooltip tooltipContent={endTime.toLocaleString()} direction="top">
              <p>Round ends in {formatTime((timeLeftMs ?? 0) / 1000)}</p>
              <div className="flex flex-col gap-2 text-white">
                <p className="text-md font-bold">
                  {EmpireEnumToName[turn.empire as EEmpire]}'s Turn in {timeLeft}
                </p>
              </div>
            </Tooltip>
            {showBlockchainUnits.enabled && !!blocksLeft && (
              <span className="text-xs">({blocksLeft.toLocaleString()} blocks)</span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const GameOver = () => {
  const { tables } = useCore();
  const victoryClaimed = tables.WinningEmpire.use()?.empire ?? (0 as EEmpire);

  return (
    <>
      {!!victoryClaimed && <WithdrawButton empire={victoryClaimed} />}
      {!victoryClaimed && <ClaimVictoryButtons />}
    </>
  );
};
const ClaimVictoryButtons = () => {
  const { claimVictory } = useContractCalls();

  return (
    <Card>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold uppercase">Game over.</p>
        <p className="text-sm font-semibold uppercase">Claim Victory for an empire</p>
        <div className="flex justify-center gap-2">
          <Button variant="ghost" size="md" className="bg-red-600 text-white" onClick={() => claimVictory(EEmpire.Red)}>
            Red
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="bg-green-600 text-white"
            onClick={() => claimVictory(EEmpire.Green)}
          >
            Green
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="bg-blue-600 text-white"
            onClick={() => claimVictory(EEmpire.Blue)}
          >
            Blue
          </Button>
        </div>
      </div>
    </Card>
  );
};

const WithdrawButton = ({ empire }: { empire: EEmpire }) => {
  const calls = useContractCalls();
  const { tables } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const { pot } = usePot();

  const empirePoints = tables.Empire.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const playerEmpirePoints = tables.Value_PointsMap.useWithKeys({ empireId: empire, playerId: entity })?.value ?? 0n;

  const playerPot = empirePoints ? (pot * playerEmpirePoints) / empirePoints : 0n;

  const empireName = empire == EEmpire.Blue ? "Blue" : empire == EEmpire.Green ? "Green" : "Red";

  return (
    <Card className="flex flex-col">
      <p>
        Game over. <span className="font-semibold">{empireName}</span> won!
      </p>
      {playerPot > 0n && (
        <div className="flex flex-col gap-1">
          <p>
            You earned <Price wei={playerPot} />!
          </p>
          <Button variant="primary" size="sm" onClick={calls.withdrawEarnings}>
            Withdraw
          </Button>
        </div>
      )}
      {playerPot === 0n && <p>You have no earnings to withdraw.</p>}
    </Card>
  );
};
