import { Address } from "viem";

import { AccountClient, Core, createExecute, ExecuteFunctions } from "@primodiumxyz/core";
import { createDevCalls } from "@/config/contractCalls/calls/dev";

export type ContractCalls = ReturnType<typeof createContractCalls>;
export const createContractCalls = (
  core: Core,
  accountClient: AccountClient,
  execute: ExecuteFunctions,
  requestDrip?: (address: Address) => void,
) => {
  const devCalls = createDevCalls(execute);

  return {
    ...execute,
    ...devCalls,
  };
};
