import { Planet, PlanetData } from "codegen/index.sol";

library LibUpdateWorld {
  function updatePlanet(bytes32 planetId) internal {
    PlanetData memory planetData = Planet.get(planetId);
    if (planetData.factionId == bytes32("")) return;
  }
}
