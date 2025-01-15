import { resourceToHex } from "@latticexyz/common";

import { useCore } from "@primodiumxyz/core/react";
import useWinningEmpire from "@/hooks/useWinningEmpire";

import { useEffect, useState } from "react";

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

  const [pot, setPot] = useState<bigint>(0n);
  let { gameOver } = useWinningEmpire();
  let gameEndPot = tables.Balances.useWithKeys({ namespaceId: gameHex })?.balance ?? 0n; // to be used only when the game is over
  let rake = tables.Balances.useWithKeys({ namespaceId: adminHex })?.balance ?? 0n;
  const refreshMs: number = 2000

  useEffect(() => {
    const interval = setInterval(() => {
      gameOver = useWinningEmpire().gameOver;
      gameEndPot = tables.Balances.useWithKeys({ namespaceId: gameHex })?.balance ?? 0n;
      if (gameEndPot != 0n) {
        setPot(gameEndPot);
      }
      rake = tables.Balances.useWithKeys({ namespaceId: adminHex })?.balance ?? 0n;
    }, refreshMs);

    return () => clearInterval(interval);
  }, [refreshMs]);

  return { pot, gameEndPot, rake };
};
