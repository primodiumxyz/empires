import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

export const useWinRate = (empire: EEmpire) => {
  const { tables } = useCore();
  const blockNumber = tables.BlockNumber.use()?.value ?? 0n;

  return useMemo(() => {
    const winningEmpire = tables.WinningEmpire.get()?.empire;
    if (!!winningEmpire) {
      return winningEmpire == empire ? 100 : 0;
    }

    const allPlanets = tables.Planet.getAll().map((planet) => tables.Planet.get(planet)!);
    const allCitadels = tables.Planet.getAllWith({ isCitadel: true }).map((planet) => tables.Planet.get(planet)!);

    const gameOverBlock = tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
    const timePercentage = Number((blockNumber * 100n) / gameOverBlock);
    const citadelWeight = 0.6 + (timePercentage / 100) * 0.3; // increases from 60% to 90%
    const planetWeight = 1 - citadelWeight; // decreases from 40% to 10%

    let totalScore = 0;
    const allScores = Object.values(EEmpire).reduce(
      (acc, emp) => {
        if (emp === EEmpire.NULL) return acc;

        const planets = allPlanets.filter((planet) => planet.empireId === emp).length;
        const citadels = allCitadels.filter((planet) => planet.empireId === emp).length;
        const score = citadels * citadelWeight + planets * planetWeight;
        totalScore += score;
        acc[emp as EEmpire] = score;
        return acc;
      },
      {} as Record<EEmpire, number>,
    );

    const empireScore = allScores[empire];
    const winRate = (empireScore / totalScore) * 100;

    return Math.round(winRate);
  }, [empire, blockNumber]);
};
