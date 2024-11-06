// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { EmpiresSystem } from "systems/EmpiresSystem.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { CitadelPlanetsSet } from "adts/CitadelPlanetsSet.sol";
import { AcidPlanetsSet } from "adts/AcidPlanetsSet.sol";
import { PointsMap } from "adts/PointsMap.sol";
import { PlayersMap } from "adts/PlayersMap.sol";
import { Ready, PendingMove, WinningEmpire, HistoricalPointPrice, Magnet, P_GameConfig, Empire, MagnetTurnPlanets } from "codegen/index.sol";
import { EEmpire } from "codegen/common.sol";

contract ResetClearLoopSubsystem is EmpiresSystem {
  function clearLoop() public returns (bool resetComplete) {
    // get list of planets
    bytes32[] memory planets = PlanetsSet.getPlanetIds();

    // get the number of empires; currently around 6
    uint8 empireCount = P_GameConfig.getEmpireCount();

    // get houw many empires have been reset
    uint8 empiresCleared = P_GameConfig.getEmpiresCleared();

    // we're going to reset the next one.  this should always be <= empireCount
    uint8 targetEmpire = empiresCleared + 1;

    EEmpire empire = EEmpire(targetEmpire);
    uint256 magnetEndTurn = 0;
    for (uint256 j = 0; j < planets.length; j++) {
      PendingMove.deleteRecord(planets[j]);

      if (Magnet.getIsMagnet(empire, planets[j])) {
        magnetEndTurn = Magnet.getEndTurn(empire, planets[j]);
        MagnetTurnPlanets.deleteRecord(empire, magnetEndTurn);
      }

      Magnet.deleteRecord(empire, planets[j]);
    }

    EmpirePlanetsSet.clear(empire);
    AcidPlanetsSet.clear(empire);
    PointsMap.clear(empire);
    Empire.setIsDefeated(empire, false);

    // if we've reset all the empires, then we're done
    // so do the final cleanup, and ready the next round
    if (targetEmpire == empireCount) {
      PlayersMap.clear();
      PlanetsSet.clear();
      CitadelPlanetsSet.clear();
      // Does not reset Player table, that's fine. it only contains id and spent
      // by not clearing Player.spent, we can keep track of how much each player has spent over multiple matches

      WinningEmpire.set(EEmpire.NULL);

      Ready.set(true); // this call closes the Ready.set(false) in ResetSystem.resetGame::15
      resetComplete = true; // tell resetGame we can finalie cleanup
    }
    // otherwise, we've got more empires to reset
    // so save our progress, and we'll pick up where we left off next call
    else {
      P_GameConfig.setEmpiresCleared(targetEmpire);
      resetComplete = false;
    }
  }
}
