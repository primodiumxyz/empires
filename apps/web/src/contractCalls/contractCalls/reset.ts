import { Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";

export const createResetCalls = (core: Core, { execute }: ExecuteFunctions) => {
  const resetGame = async (nextGameStartBlock: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__resetGame",
      args: [nextGameStartBlock],
      options: { gas: 26_000_000n },
      txQueueOptions: {
        id: `reset-game`,
        ...options,
      },
    });
  };

  return { resetGame };
};
