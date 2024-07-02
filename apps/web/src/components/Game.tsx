import { formatNumber } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity } from "@primodiumxyz/reactive-tables";
import { Logout } from "@/components/Logout";
import { TransactionQueueMask } from "@/components/shared/TransactionQueueMask";
import { useTxExecute } from "@/hooks/useTxExecute";

const Game = () => {
  const { tables } = useCore();
  const doubleCount = tables.DoubleCounter.use()?.value;
  const { execute } = useTxExecute();

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
      <Logout />

      <h1 className="text-lg font-bold">Primodium Empires</h1>
      <img src={"primodium.jpg"} className="logo w-32" alt="Vite logo" />
    </div>
  );
};

export default Game;
