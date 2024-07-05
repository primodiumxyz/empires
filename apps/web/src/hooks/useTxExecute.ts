import { createExecute } from "@primodiumxyz/core";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";

export const useTxExecute = () => {
  const core = useCore();
  const accountClient = useAccountClient();
  return createExecute(core, accountClient);
};
