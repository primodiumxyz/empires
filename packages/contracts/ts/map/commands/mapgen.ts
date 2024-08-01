import { getSrcDirectory } from "@latticexyz/common/foundry";
import path from "path";
import { generateMap as mapgen } from "../mapGeneration";

const srcDirectory = await getSrcDirectory();

const generateMap = () => {
  mapgen(path.join(srcDirectory, "codegen"));
};

generateMap();
