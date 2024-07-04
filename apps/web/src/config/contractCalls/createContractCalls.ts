import { Address } from "viem";

import { AccountClient, Core } from "@primodiumxyz/core";

export type contractCalls = ReturnType<typeof createContractCalls>;
export const createContractCalls = (
  core: Core,
  accountClient: AccountClient,
  requestDrip?: (address: Address) => void,
) => {};
