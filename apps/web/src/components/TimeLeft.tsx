import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatTime } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { usePot } from "@/hooks/usePot";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const TimeLeft = () => {
  const { timeLeft, gameOver } = useTimeLeft();
  return (
    <div className="absolute top-4 flex w-72 flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      {!gameOver && <p>Round ends in {formatTime(timeLeft)} </p>}
      {gameOver && <GameOver />}
    </div>
  );
};

const GameOver = () => {
  const { tables } = useCore();
  const victoryClaimed = tables.WinningEmpire.use()?.empire ?? (0 as EEmpire);
  return <WithdrawButton empire={victoryClaimed} />;
  return (
    <>
      {!victoryClaimed && <ClaimVictoryButtons />}
      {!!victoryClaimed && <WithdrawButton empire={victoryClaimed} />}
    </>
  );
};
const ClaimVictoryButtons = () => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-bold uppercase">Claim Victory for an empire</p>
      <div className="flex justify-center gap-2">
        <button className="btn bg-red-700" onClick={() => null}>
          Red
        </button>
        <button className="btn btn-success">Green</button>
        <button className="btn btn-accent">Blue</button>
      </div>
    </div>
  );
};

const WithdrawButton = ({ empire }: { empire: EEmpire }) => {
  const { tables } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const _pot = usePot();
  const rakeTaken = tables.RakeTaken.use()?.value ?? false;
  const rake = tables.P_PointConfig.use()?.pointRake ?? 0n;

  const pot = rakeTaken ? _pot : (_pot * (10_000n - rake)) / 10_000n;
  const factionPoints = tables.Faction.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const playerFactionPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId: entity })?.value ?? 0n;

  const playerPot = factionPoints ? (pot * playerFactionPoints) / factionPoints : 0n;

  return (
    <>
      {playerPot > 0n && (
        <div className="flex flex-col">
          <p>You earned ({formatEther(playerPot)}ETH)!</p>
          <button>Withdraw</button>
        </div>
      )}
      {playerPot == 0n && <p>Sorry, you earned nothing. Better luck next time!</p>}
    </>
  );
};
