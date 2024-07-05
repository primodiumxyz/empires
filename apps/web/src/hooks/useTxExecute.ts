import { createExecute } from "@core";
import { useAccountClient, useCore } from "@core/react";

export const useTxExecute = () => {
  const core = useCore();
  const accountClient = useAccountClient();
  return createExecute(core, accountClient);
};
