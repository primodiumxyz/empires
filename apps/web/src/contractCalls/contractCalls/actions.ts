import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";

export const createActionCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const createDestroyer = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Empires__createDestroyer",
      args: [planetId],
      txQueueOptions: {
        id: `${planetId}-create-destroyer`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const killDestroyer = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Empires__killDestroyer",
      args: [planetId],
      txQueueOptions: {
        id: `${planetId}-kill-destroyer`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  return { createDestroyer, removeDestroyer: killDestroyer };
};
