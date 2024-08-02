import { AccountClient, Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";

export const createOverrideCalls = (core: Core, { playerAccount }: AccountClient, { execute }: ExecuteFunctions) => {
  const createShip = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__createShip",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 552401n * 2n },
      txQueueOptions: {
        id: `${planetId}-create-ship`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const removeShip = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__killShip",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 739007n * 2n },
      txQueueOptions: {
        id: `${planetId}-kill-ship`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const addShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__chargeShield",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 546063n * 2n },
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
      options: { gas: 151271n * 2n },
      txQueueOptions: {
        id: "sell-points",
        ...options,
      },
    });
  };

  const removeShield = async (
    planetId: Entity,
    overrideCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__drainShield",
      args: [planetId, overrideCount],
      options: { value: payment, gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-remove-shield`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };
  const tacticalStrike = async (planetId: Entity, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__tacticalStrike",
      args: [planetId],
      options: { gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-tactical-strike`,
        ...options,
      },
      onComplete: (receipt) => {},
    });
  };

  const boostCharge = async (planetId: Entity, count: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__boostCharge",
      args: [planetId, count],
      options: { value: payment, gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-boost-charge`,
        ...options,
      },
    });
  };

  const stunCharge = async (planetId: Entity, count: bigint, payment: bigint, options?: Partial<TxQueueOptions>) => {
    return await execute({
      functionName: "Empires__stunCharge",
      args: [planetId, count],
      options: { value: payment, gas: 738649n * 2n },
      txQueueOptions: {
        id: `${planetId}-stun-charge`,
        ...options,
      },
    });
  };

  return { createShip, removeShip, addShield, removeShield, sellPoints, tacticalStrike, boostCharge, stunCharge };
};
