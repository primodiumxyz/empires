import { resourceToHex } from "@latticexyz/common";

import { useCore } from "@primodiumxyz/core/react";

export const usePot = () => {
  const { tables } = useCore();
  const hex = resourceToHex({
    type: "namespace",
    namespace: tables.P_GameConfig.metadata.globalName.split("__")[0],
    name: "",
  });
  return tables.Balances.useWithKeys({ namespaceId: hex })?.balance ?? 0n;
};
