import { Address } from "viem";

import { ERole } from "@primodiumxyz/contracts";
import { Core, ExecuteFunctions, TxQueueOptions } from "@primodiumxyz/core";
import { withTransactionStatus } from "@/util/notify";

export const createAdminCalls = (core: Core, { execute }: ExecuteFunctions) => {
  const pause = async (options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__pause",
          args: [],
          txQueueOptions: {
            id: "pause-game",
            ...options,
          },
        }),
      {
        loading: "Pausing the game",
        success: "Game paused successfully",
        error: "Failed to pause the game",
      },
    );
  };

  const unpause = async (options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__unpause",
          args: [],
          txQueueOptions: {
            id: "unpause-game",
            ...options,
          },
        }),
      {
        loading: "Unpausing the game",
        success: "Game unpaused successfully",
        error: "Failed to unpause the game",
      },
    );
  };

  const setRole = async (address: Address, role: ERole, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__setRole",
          args: [address, role],
          txQueueOptions: {
            id: "set-role",
            ...options,
          },
        }),
      {
        loading: `Setting role for ${address}`,
        success: `Role set successfully for ${address}`,
        error: "Failed to set role",
      },
    );
  };

  const removeRole = async (address: Address, options?: Partial<TxQueueOptions>) => {
    return await withTransactionStatus(
      () =>
        execute({
          functionName: "Empires__removeRole",
          args: [address],
          txQueueOptions: {
            id: "remove-role",
            ...options,
          },
        }),
      {
        loading: `Removing role for ${address}`,
        success: `Role removed successfully for ${address}`,
        error: "Failed to remove role",
      },
    );
  };

  return {
    pause,
    unpause,
    setRole,
    removeRole,
  };
};
