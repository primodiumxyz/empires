import { Address } from "viem";

import { AccountClient, Core, createExecute } from "@primodiumxyz/core";
import { createActionCalls } from "@/contractCalls/contractCalls/actions";
import { createUpdatecalls } from "@/contractCalls/contractCalls/update";

export type ContractCalls = ReturnType<typeof createContractCalls>;

export const createContractCalls = (
  core: Core,
  accountClient: AccountClient,
  requestDrip?: (address: Address) => void,
) => {
  const execute = createExecute(core, accountClient);

  const actionCalls = createActionCalls(core, accountClient, execute);
  const updateCalls = createUpdatecalls(core, accountClient, execute);

  return {
    ...execute,
    ...actionCalls,
    ...updateCalls,
  };
};
