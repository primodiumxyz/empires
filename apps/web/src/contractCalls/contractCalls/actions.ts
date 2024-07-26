import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";

export const createActionCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const createShip = async (planetId: Entity, actionCount: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__createShip",
      args: [planetId, actionCount],
      options: { value: payment, gas: 552401n * 3n / 2n },
      txQueueOptions: {
        id: `${planetId}-create-ship`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const removeShip = async (planetId: Entity, actionCount: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__killShip",
      args: [planetId, actionCount],
      options: { value: payment, gas: 739007n * 3n / 2n },
      txQueueOptions: {
        id: `${planetId}-kill-ship`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const addShield = async (planetId: Entity, actionCount: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__chargeShield",
      args: [planetId, actionCount],
      options: { value: payment, gas: 546063n * 3n / 2n },
      txQueueOptions: {
        id: `${planetId}-add-shield`,
        ...options,
      },
    });
  };
  const sellPoints = async (empire: number, amount: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__sellPoints",
      args: [empire, amount],
      options: { gas: 151271n * 3n / 2n },
      txQueueOptions: {
        id: "sell-points",
        ...options,
      },
    });
  };

  const removeShield = async (planetId: Entity, actionCount: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__drainShield",
      args: [planetId, actionCount],
      options: { value: payment, gas: 738649n * 3n / 2n },
      txQueueOptions: {
        id: `${planetId}-remove-shield`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  return { createShip, removeShip, addShield, removeShield, sellPoints };
};
