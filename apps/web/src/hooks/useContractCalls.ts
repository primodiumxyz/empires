import { useMemo } from "react";

import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";
import { createContractCalls } from "@/contractCalls/createContractCalls";

export const useContractCalls = () => {
  const core = useCore();
  const playerAccount = usePlayerAccount();

  return useMemo(() => {
    return createContractCalls(core, playerAccount);
  }, [core, playerAccount]);
};
