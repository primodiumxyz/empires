import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatTime } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePot } from "@/hooks/usePot";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const TimeLeft = () => {
  const { timeLeftMs, gameOver } = useTimeLeft();
  return (
    <div className="absolute top-4 flex w-72 flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      {!gameOver && <p>Round ends in {formatTime((timeLeftMs ?? 0) / 1000)} </p>}
      {gameOver && <GameOver />}
    </div>
  );
};

const GameOver = () => {
  const { tables } = useCore();
  const victoryClaimed = tables.WinningEmpire.use()?.empire ?? (0 as EEmpire);
  return (
    <>
      {!victoryClaimed && <ClaimVictoryButtons />}
      {!!victoryClaimed && <WithdrawButton empire={victoryClaimed} />}
    </>
  );
};
const ClaimVictoryButtons = () => {
  const calls = useContractCalls();
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-bold uppercase">Game over. Claim Victory for an empire</p>
      <div className="flex justify-center gap-2">
        <button className="btn bg-red-700" onClick={() => calls.claimVictory(EEmpire.Red)}>
          Red
        </button>
        <button className="btn btn-success" onClick={() => calls.claimVictory(EEmpire.Green)}>
          Green
        </button>
        <button className="btn btn-accent" onClick={() => calls.claimVictory(EEmpire.Blue)}>
          Blue
        </button>
      </div>
    </div>
  );
};

const WithdrawButton = ({ empire }: { empire: EEmpire }) => {
  const calls = useContractCalls();
  const { tables, utils } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const { pot } = usePot();
  const { price } = useEthPrice();

  const factionPoints = tables.Faction.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const playerFactionPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId: entity })?.value ?? 0n;

  const playerPot = factionPoints ? (pot * playerFactionPoints) / factionPoints : 0n;
  const playerPotUSD = price ? utils.weiToUsd(playerPot, price) : "loading...";

  const empireName = empire == EEmpire.Blue ? "Blue" : empire == EEmpire.Green ? "Green" : "Red";
  return (
    <div className="flex flex-col">
      <p>Game over. {empireName} won!</p>
      {playerPot > 0n && (
        <div className="flex flex-col">
          <p>
            You earned {playerPotUSD} ({formatEther(playerPot)}ETH)!
          </p>
          <button className="btn btn-primary btn-sm" onClick={calls.withdrawEarnings}>
            Withdraw
          </button>
        </div>
      )}
      {playerPot == 0n && <p>You have no earnings to withdraw.</p>}
    </div>
  );
};
