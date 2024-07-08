import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";

export const createUpdateCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const updateWorld = async (options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Empires__updateWorld",
      args: [],
      txQueueOptions: {
        id: `update-world`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  return { updateWorld };
};
