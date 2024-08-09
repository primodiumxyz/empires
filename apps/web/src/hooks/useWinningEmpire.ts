import { useMemo } from "react";

import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";

const useWinningEmpire = (): { gameOver: boolean; empire: EEmpire | null } => {
  const { tables } = useCore();

  // Check if there's a winning empire in the WinningEmpire table
  let winningEmpire = tables.WinningEmpire.use()?.empire || null;
  // If no winning empire is set, calculate it
  const gameOverBlock = tables.P_GameConfig.use()?.gameOverBlock ?? 0n;
  const currentBlock = tables.BlockNumber.use()?.value ?? 0n;

  const citadelPlanets = tables.Keys_CitadelPlanetsSet.use()?.itemKeys ?? [];

  return useMemo(() => {
    if (winningEmpire !== null && winningEmpire !== 0) {
      return { gameOver: true, empire: winningEmpire };
    }

    const empiresCitadelCount = new Array(EEmpire.LENGTH).fill(0);
    const empiresTotalPlanets = new Array(EEmpire.LENGTH).fill(0);
    // Count citadel planets for each empire
    citadelPlanets.forEach((planetId) => {
      const empire = tables.Planet.getWithKeys({ id: planetId })?.empireId;
      if (empire !== undefined) empiresCitadelCount[empire]++;
    });

    // Count total planets for each empire
    for (let empire = 1; empire < EEmpire.LENGTH; empire++) {
      const planets = tables.Keys_EmpirePlanetsSet.getWithKeys({ empireId: empire })?.itemKeys ?? [];
      empiresTotalPlanets[empire] = planets.length;
    }

    // Check for domination victory
    const totalCitadelPlanets = citadelPlanets.length;
    for (let empire = 1; empire < EEmpire.LENGTH; empire++) {
      if (empiresCitadelCount[empire] === totalCitadelPlanets) {
        return { gameOver: true, empire: empire as EEmpire };
      }
    }

    if (currentBlock <= gameOverBlock) {
      return { gameOver: false, empire: null };
    }

    // Determine winning empire
    let maxCitadelPlanets = 0;

    for (let empire = 1; empire < EEmpire.LENGTH; empire++) {
      if (empiresCitadelCount[empire] > maxCitadelPlanets) {
        maxCitadelPlanets = empiresCitadelCount[empire];
        winningEmpire = empire;
      } else if (empiresCitadelCount[empire] === maxCitadelPlanets && winningEmpire !== null) {
        if (empiresTotalPlanets[empire] > empiresTotalPlanets[winningEmpire]) {
          winningEmpire = empire;
        }
      }
    }

    return { gameOver: true, empire: winningEmpire };
  }, [gameOverBlock, currentBlock, citadelPlanets, tables]);
};

export default useWinningEmpire;
