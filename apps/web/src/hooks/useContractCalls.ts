import { useMemo } from "react";

import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { createContractCalls } from "@/config/contractCalls/createContractCalls";
import { useDripAccount } from "@/hooks/useDripAccount";

export const useContractCalls = () => {
  const core = useCore();
  const accountClient = useAccountClient();
  const requestDrip = useDripAccount();

  return useMemo(() => {
    return createContractCalls(core, accountClient, requestDrip);
  }, [core, accountClient, requestDrip]);
};
