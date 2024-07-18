import { formatEther } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { formatTime } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePot } from "@/hooks/usePot";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const TimeLeft = () => {
  const { timeLeftMs, gameOver } = useTimeLeft();
  return (
    <div className="flex w-72 flex-col justify-center gap-1 rounded text-center">
      {gameOver && <GameOver />}
      {!gameOver && (
        <Card className="py-2 text-sm" noDecor>
          Round ends in {formatTime((timeLeftMs ?? 0) / 1000)}{" "}
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
  const { tables, utils } = useCore();
  const {
    playerAccount: { entity },
  } = useAccountClient();
  const { pot } = usePot();
  const { price } = useEthPrice();

  const factionPoints = tables.Faction.useWithKeys({ id: empire })?.pointsIssued ?? 0n;
  const playerFactionPoints = tables.Value_PointsMap.useWithKeys({ factionId: empire, playerId: entity })?.value ?? 0n;

  const playerPot = factionPoints ? (pot * playerFactionPoints) / factionPoints : 0n;
  const playerPotUSD = price ? utils.ethToUSD(playerPot, price) : "loading...";

  const empireName = empire == EEmpire.Blue ? "Blue" : empire == EEmpire.Green ? "Green" : "Red";

  return (
    <Card className="flex flex-col">
      <p>
        Game over. <span className="font-semibold">{empireName}</span> won!
      </p>
      {playerPot > 0n && (
        <div className="flex flex-col gap-1">
          <p>
            You earned {playerPotUSD} ({formatEther(playerPot)} ETH)!
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
