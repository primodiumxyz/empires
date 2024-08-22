import { createExecute } from "@primodiumxyz/core";
import { useCore, usePlayerAccount } from "@primodiumxyz/core/react";

export const useTxExecute = () => {
  const core = useCore();
  const playerAccount = usePlayerAccount();
  return createExecute(core, playerAccount);
};
