import { Address } from "viem";

import { Core, createExecute, ExternalAccount, LocalAccount } from "@primodiumxyz/core";
import { createDevCalls } from "@/contractCalls/contractCalls/dev";
import { createEndGameCalls } from "@/contractCalls/contractCalls/endGame";
import { createOverrideCalls } from "@/contractCalls/contractCalls/overrides";
import { createResetCalls } from "@/contractCalls/contractCalls/reset";
import { createUpdateCalls } from "@/contractCalls/contractCalls/update";

export type ContractCalls = ReturnType<typeof createContractCalls>;

export const createContractCalls = (
  core: Core,
  playerAccount: ExternalAccount | LocalAccount,
  requestDrip?: (address: Address) => void,
) => {
  const execute = createExecute(core, playerAccount);
  const devCalls = createDevCalls(execute);

  const overrideCalls = createOverrideCalls(core, execute);
  const updateCalls = createUpdateCalls(core, execute);
  const resetCalls = createResetCalls(core, execute);
  const endGameCalls = createEndGameCalls(core, execute);

  return {
    ...execute,
    devCalls,
    ...overrideCalls,
    ...updateCalls,
    ...resetCalls,
    ...endGameCalls,
    requestDrip,
  };
};
