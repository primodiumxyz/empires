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

    // Calculate owned planets and citadels for each empire
    const empireCounts = Object.values(EEmpire).reduce(
      (acc, emp) => {
        acc[emp as EEmpire] = {
          planets: allPlanets.filter((planet) => planet.empireId === emp).length,
          citadels: allCitadels.filter((planet) => planet.empireId === emp).length,
        };
        return acc;
      },
      {} as Record<EEmpire, { planets: number; citadels: number }>,
    );

    const gameOverBlock = tables.P_GameConfig.get()?.gameOverBlock ?? 0n;
    const timePercentage = Number((blockNumber * 100n) / gameOverBlock);

    // Adjust weights based on time
    const citadelWeight = 0.6 + (timePercentage / 100) * 0.3; // increases from 60% to 90%
    const planetWeight = 1 - citadelWeight; // decreases from 40% to 10%

    // Calculate total weighted score for all empires
    const totalScore = Object.values(empireCounts).reduce((total, count) => {
      return total + (count.citadels * citadelWeight + count.planets * planetWeight);
    }, 0);

    // Calculate win rate for the specific empire
    const empireScore = empireCounts[empire].citadels * citadelWeight + empireCounts[empire].planets * planetWeight;
    const winRate = (empireScore / totalScore) * 100;

    return Math.round(winRate);
  }, [empire, blockNumber]);
};
