import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";

export const createUpdatecalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const updateWorld = async (options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Pri_updateWorld",
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
