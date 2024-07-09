import { useMemo } from "react";

import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { createContractCalls } from "@/contractCalls/createContractCalls";

export const useContractCalls = () => {
  const core = useCore();
  const accountClient = useAccountClient();

  return useMemo(() => {
    return createContractCalls(core, accountClient);
  }, [core, accountClient]);
};
