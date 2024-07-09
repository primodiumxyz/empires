import { Address } from "viem";

import { AccountClient, Core, createExecute } from "@primodiumxyz/core";
import { createActionCalls } from "@/contractCalls/contractCalls/actions";
import { createDevCalls } from "@/contractCalls/contractCalls/dev";
import { createResetCalls } from "@/contractCalls/contractCalls/reset";
import { createUpdateCalls } from "@/contractCalls/contractCalls/update";

export type ContractCalls = ReturnType<typeof createContractCalls>;

export const createContractCalls = (
  core: Core,
  accountClient: AccountClient,
  requestDrip?: (address: Address) => void,
) => {
  const execute = createExecute(core, accountClient);
  const devCalls = createDevCalls(execute);

  const actionCalls = createActionCalls(core, accountClient, execute);
  const updateCalls = createUpdateCalls(core, accountClient, execute);
  const resetCalls = createResetCalls(core, accountClient, execute);

  return {
    ...execute,
    ...devCalls,
    ...actionCalls,
    ...updateCalls,
    ...resetCalls,
  };
};
