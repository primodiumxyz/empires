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

  return planets
    .map((_empire, i) => {
      const empire = _empire - 1;
      if (empire === -1) return "";
      const r = Math.floor(i / planetMap.width) - center.r;
      const q = (i % planetMap.width) - center.q + OFFSET;
      const coord = oddrToAxial({ row: r, col: q });

      const empireName = EmpireNames[empire] ?? "NULL";

      return `
            /* Planet at (${coord.q}, ${coord.r}) */
            planetId = coordToId(${coord.q}, ${coord.r});
            planetData.empireId = EEmpire.${empireName};
            planetData.q = ${coord.q};
            planetData.r = ${coord.r};
            planetData.shieldCount = ${empireName === "NULL" ? 4 : 0};
            Planet.set(planetId, planetData);

            PlanetsSet.add(planetId);
            ${empireName === "NULL" ? "" : `EmpirePlanetsSet.add(EEmpire.${empireName}, planetId);`}

            createTacticalCharge(planetId, ${empireName === "NULL" ? 0 : "chargeRate"});
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
import { Planet, PlanetData, Empire, Planet_TacticalStrikeData, Planet_TacticalStrike, P_TacticalStrikeConfig } from "codegen/index.sol";
import { EEmpire, EOrigin, EOverride } from "codegen/common.sol";
import { coordToId } from "src/utils.sol";

function createPlanets() {

  bytes32 planetId;
  uint256 chargeRate = P_TacticalStrikeConfig.getChargeRate();

  Empire.set(EEmpire.Red, EOrigin.North, 0, 0);
  Empire.set(EEmpire.Blue, EOrigin.North, 0, 0);
  Empire.set(EEmpire.Green, EOrigin.North, 0, 0);
  PlanetData memory planetData = PlanetData({
    q: 0,
    r: 0,
    isPlanet: true,
    shipCount: 0,
    shieldCount: 0,
    empireId: EEmpire.Red,
    goldCount: 0,
  });

  ${str}
}

function createTacticalCharge(bytes32 planetId, uint256 chargeRate) {
  Planet_TacticalStrikeData memory planetTacticalStrikeData = Planet_TacticalStrikeData({
    lastUpdated: block.number,
    chargeRate: chargeRate, // out of 100
    charge: 0
  });
  Planet_TacticalStrike.set(planetId, planetTacticalStrikeData);
}
`;
}
