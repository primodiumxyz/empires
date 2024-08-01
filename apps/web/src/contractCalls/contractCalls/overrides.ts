import { EEmpire } from "@primodiumxyz/contracts";
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

  const placeMagnet = async (
    empire: EEmpire,
    planetId: Entity,
    turnCount: bigint,
    payment: bigint,
    options?: Partial<TxQueueOptions>,
  ) => {
    return await execute({
      functionName: "Empires__placeMagnet",
      args: [empire, planetId, turnCount],
      options: { value: payment, gas: 546063n * 2n },
      txQueueOptions: {
        id: `${planetId}-place-magnet`,
        ...options,
      },
    });
  };

  return { createShip, removeShip, addShield, removeShield, sellPoints, placeMagnet };
};
