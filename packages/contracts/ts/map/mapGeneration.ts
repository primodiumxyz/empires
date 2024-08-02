import { formatAndWriteSolidity } from "@latticexyz/common/codegen";
import path from "path";
import planetMap from "../../../assets/maps/planet-map/planetMap.json";

export async function generateMap(outputBaseDirectory: string) {
  const content = generateContent();
  const finalContent = addContext(content);
  const fullOutputPath = path.join(outputBaseDirectory, `scripts/CreatePlanets.sol`);
  await formatAndWriteSolidity(finalContent, fullOutputPath, `Generated terrain`);
}

const EmpireNames = ["NULL", "Red", "Blue", "Green"];
const OFFSET = 100;
function oddrToAxial(hex: { row: number; col: number }) {
  const q = hex.col - (hex.row - (hex.row & 1)) / 2;
  const r = hex.row;
  return { q, r };
}

function generateContent() {
  const center = { q: Math.floor((planetMap.width - 1) / 2), r: Math.floor((planetMap.height - 1) / 2) };
  const planets = planetMap.layers[0].data;

  let count = 0;
  return planets
    .map((_empire, i) => {
      const empire = _empire - 1;
      if (empire === -1) return "";
      const r = Math.floor(i / planetMap.width) - center.r;
      const q = (i % planetMap.width) - center.q + OFFSET;
      const coord = oddrToAxial({ row: r, col: q });

      const planetName = `planet${count++}`;
      const empireName = EmpireNames[empire] ?? "NULL";

      return `
            bytes32 ${planetName} = coordToId(${coord.q}, ${coord.r});
            ${
              empireName === "NULL"
                ? ""
                : `EmpirePlanetsSet.add(EEmpire.${empireName}, ${planetName}); 
                  Empire.set(EEmpire.${empireName}, EOrigin.North, 0, 0);
                  planetData.empireId = EEmpire.${empireName};
                  `
            }
            planetData.q = ${coord.q};
            planetData.r = ${coord.r};
            PlanetsSet.add(${planetName});
            Planet.set(${planetName}, planetData);
            Planet_TacticalStrike.set(${planetName}, planetTacticalStrikeData);
            `;
    })
    .join("");
}

function addContext(str: string) {
  return `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.24;

import { console } from "forge-std/console.sol";
import { IWorld } from "codegen/world/IWorld.sol";
import { PlanetsSet } from "adts/PlanetsSet.sol";
import { EmpirePlanetsSet } from "adts/EmpirePlanetsSet.sol";
import { Planet, PlanetData, Empire, Planet_TacticalStrikeData, Planet_TacticalStrike } from "codegen/index.sol";
import { EEmpire, EOrigin, EOverride } from "codegen/common.sol";
import { coordToId } from "src/utils.sol";

function createPlanets() {
  Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrikeData({
    lastUpdated: block.number,
    chargeRate: 100, // out of 100
    charge: 0
  });

  PlanetData memory planetData = PlanetData({
    q: 0,
    r: 0,
    isPlanet: true,
    shipCount: 0,
    shieldCount: 0,
    empireId: EEmpire.Red,
    goldCount: 0
  });

  ${str}
}
`;
}
