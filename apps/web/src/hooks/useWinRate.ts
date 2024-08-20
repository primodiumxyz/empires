import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

export const useWinRate = (empire: EEmpire) => {
  const { tables } = useCore();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  return useMemo(() => {
    const planetCount = tables.Planet.getAll().length;
    const citadelCount = tables.Planet.getAllWith({ isCitadel: true }).length;

    const ownedPlanetCount = tables.Planet.getAllWith({ empireId: empire }).length;
    const ownedCitadelCount = tables.Planet.getAllWith({ isCitadel: true, empireId: empire }).length;

    const citadelPercentage = (ownedCitadelCount / citadelCount) * 100;
    const planetPercentage = (ownedPlanetCount / planetCount) * 100;

    const gameOverBlock = tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
    const timePercentage = Number((blockNumber * 100n) / gameOverBlock);

    // Adjust weights based on game progress
    const citadelWeight = 0.6 + (timePercentage / 100) * 0.2; // increases importance of citadels over time
    const planetWeight = 0.4 - (timePercentage / 100) * 0.2; // decreases importance of total planets over time

    const winRate = citadelPercentage * citadelWeight + planetPercentage * planetWeight;

    return Math.round(winRate);
  }, [empire, blockNumber]);
};
