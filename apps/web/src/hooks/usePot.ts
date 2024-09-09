import { resourceToHex } from "@latticexyz/common";

import { useCore } from "@primodiumxyz/core/react";
import useWinningEmpire from "@/hooks/useWinningEmpire";

export const usePot = () => {
  const { tables, utils } = useCore();
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
  const gameEndPot = tables.Balances.useWithKeys({ namespaceId: gameHex })?.balance ?? 0n; // to be used only when the game is over
  let pot = 0n;
  if (useWinningEmpire().gameOver) {
    pot = gameEndPot;
  } else {
    pot = gameEndPot - utils.getTotalMaxSellValue();
  }
  const rake = tables.Balances.useWithKeys({ namespaceId: adminHex })?.balance ?? 0n;
  return { pot, rake };
};
