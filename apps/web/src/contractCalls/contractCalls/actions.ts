import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";

export const createActionCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const createDestroyer = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Pri_createDestroyer",
      args: [planetId],
      txQueueOptions: {
        id: `${planetId}-remove-destroyer`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const removeDestroyer = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    await execute({
      functionName: "Pri_removeDestroyer",
      args: [planetId],
      txQueueOptions: {
        id: `${planetId}-remove-destroyer`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  return { createDestroyer, removeDestroyer };
};
