import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";

export const createUpdateCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const updateWorld = async (options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__updateWorld",
      args: [],
      options: {
        gas: 3022414n * 3n / 2n,
      },
      txQueueOptions: {
        id: `update-world`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  return { updateWorld };
};
