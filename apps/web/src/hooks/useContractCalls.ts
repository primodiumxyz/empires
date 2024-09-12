import { useMemo } from "react";

import { createLocalAccount } from "@primodiumxyz/core";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { createContractCalls } from "@/contractCalls/createContractCalls";

const devKey = import.meta.env.PRI_DEV_PKEY;

export const useContractCalls = () => {
  const core = useCore();
  const { playerAccount } = usePlayerAccount();

  return useMemo(() => {
    const devAccount = devKey ? createLocalAccount(core.config, devKey) : null;
    return createContractCalls(core, playerAccount, devAccount);
  }, [core, playerAccount]);
};
