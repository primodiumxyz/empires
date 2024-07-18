import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";

export const createActionCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const createShip = async (planetId: Entity, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__createShip",
      args: [planetId],
      options: { value: payment },
      txQueueOptions: {
        id: `${planetId}-create-ship`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const removeShip = async (planetId: Entity, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__killShip",
      args: [planetId],
      options: { value: payment },
      txQueueOptions: {
        id: `${planetId}-kill-ship`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const sellPoints = async (empire: number, amount: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__sellPoints",
      args: [empire, amount],
      txQueueOptions: {
        id: "sell-points",
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };
  return { createShip, removeShip, sellPoints };
};
