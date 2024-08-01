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

function generateContent() {
  const center = { q: Math.floor((planetMap.width - 1) / 2), r: Math.floor((planetMap.height - 1) / 2) };
  const planets = planetMap.layers[0].data;

  let count = 0;
  return planets
    .map((_empire, i) => {
      const empire = _empire - 1;
      if (empire === -1) return "";
      const coord = { q: (i % planetMap.width) - center.q, r: Math.floor(i / planetMap.width) - center.r };

      const planetName = `planet${count++}`;
      const empireName = EmpireNames[empire] ?? "NULL";

      return `
            bytes32 ${planetName} = coordToId(${coord.q}, ${coord.r});
            Planet.set(
              ${planetName},
              PlanetData({ q: ${coord.q}, r: ${
        coord.r
      }, isPlanet: true, shipCount: 0, shieldCount: 0, empireId: EEmpire.${empireName}, goldCount: 0 })
            );
            PlanetsSet.add(${planetName});
            ${
              empireName === "NULL"
                ? ""
                : `EmpirePlanetsSet.add(EEmpire.${empireName}, ${planetName}); 
                  Empire.set(EEmpire.${empireName}, EOrigin.North, 0, 0);
                  `
            }`;
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
import { Planet, PlanetData, Empire } from "codegen/index.sol";
import { EEmpire, EOrigin, EOverride } from "codegen/common.sol";
import { coordToId } from "src/utils.sol";

function createPlanets() {
  ${str}
}
`;
}
