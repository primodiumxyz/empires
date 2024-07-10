import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useContractCalls } from "@/hooks/useContractCalls";
import { cn } from "@/util/client";

export const ResetGame = () => {
  const calls = useContractCalls();

  return (
    <TransactionQueueMask id={`reset-game`}>
      <button onClick={() => calls.resetGame()} className={cn("btn btn-secondary btn-xs text-sm uppercase")}>
        <div className="flex flex-col gap-2">RESET GAME</div>
      </button>
    </TransactionQueueMask>
  );
};
