import { EEmpire } from "@primodiumxyz/contracts";
import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";

export const createEndGameCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const claimVictory = async (winner: EEmpire, options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Empires__claimVictory",
      args: [winner],
      txQueueOptions: {
        id: `reset-game`,
        ...options,
      },
    });
  };

  const withdrawEarnings = async (options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Empires__withdrawEarnings",
      args: [],
      txQueueOptions: {
        id: `withdraw`,
        ...options,
      },
    });
  };

  return { claimVictory, withdrawEarnings };
};
