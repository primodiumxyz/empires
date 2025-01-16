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

  const { gameOver } = useWinningEmpire();
  const gameEndPot = tables.Balances.useWithKeys({ namespaceId: gameHex })?.balance ?? 0n; // to be used only when the game is over
  // const pot = gameOver ? gameEndPot : gameEndPot - utils.getTotalMaxSellValue();
  const pot = gameEndPot;
  const rake = tables.Balances.useWithKeys({ namespaceId: adminHex })?.balance ?? 0n;

  return { pot, gameEndPot, rake };
};