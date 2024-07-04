import { useMemo } from "react";

import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { createContractCalls } from "@/config/contractCalls/createContractCalls";
import { useDripAccount } from "@/hooks/useDripAccount";
import { useTxExecute } from "@/hooks/useTxExecute";

export const useContractCalls = () => {
  const core = useCore();
  const accountClient = useAccountClient();
  const execute = useTxExecute();
  const requestDrip = useDripAccount();

  return useMemo(() => {
    return createContractCalls(core, accountClient, execute, requestDrip);
  }, [core, accountClient, execute, requestDrip]);
};
