import { Logout } from "@/components/Logout";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useTxExecute } from "@/hooks/useTxExecute";
import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity } from "@primodiumxyz/reactive-tables";

const Game = () => {
  const { tables } = useCore();
  const count = tables.Counter.use()?.value;
  const doubleCount = tables.DoubleCounter.use()?.value;
  const { execute } = useTxExecute();

  const handleIncrement = async () => {
    await execute({
      functionName: "Primodium_Base__increment",
      args: [],
      options: { gas: 100_000n },
      txQueueOptions: {
        id: defaultEntity,
      },
    });
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 justify-center items-center relative">
      <Logout />

      <h1 className="text-lg font-bold">Primodium Template</h1>
      <img src={"primodium.jpg"} className="logo w-32" alt="Vite logo" />
      <TransactionQueueMask id={defaultEntity} className="card">
        <button className="btn btn-primary flex flex-col" onClick={handleIncrement}>
          <p>count is {count ? formatNumber(count) : "N/A"}</p>
          <p>doubled count is {doubleCount ? formatNumber(doubleCount) : "N/A"}</p>
        </button>
      </TransactionQueueMask>
    </div>
  );
};

export default Game;
