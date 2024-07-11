import { resourceToHex } from "@latticexyz/common";

import { useCore } from "@primodiumxyz/core/react";

export const usePot = () => {
  const { tables } = useCore();
  const gameHex = resourceToHex({
    type: "namespace",
    namespace: tables.P_GameConfig.metadata.globalName.split("__")[0],
    name: "",
  });
  const adminHex = resourceToHex({
    type: "namespace",
    namespace: "Admin",
    name: "",
  });
  const pot = tables.Balances.useWithKeys({ namespaceId: gameHex })?.balance ?? 0n;
  const rake = tables.Balances.useWithKeys({ namespaceId: adminHex })?.balance ?? 0n;
  return { pot, rake };
};
