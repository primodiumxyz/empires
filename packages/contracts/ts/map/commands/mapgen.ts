import { getSrcDirectory } from "@latticexyz/common/foundry";
import path from "path";
import { generateMap } from "../mapGeneration";

const srcDirectory = await getSrcDirectory();

const generateTerrain = () => {
  generateMap(path.join(srcDirectory, "codegen"));
};

generateTerrain();
