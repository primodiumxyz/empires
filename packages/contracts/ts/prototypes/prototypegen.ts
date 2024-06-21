import { formatAndWriteSolidity } from "@latticexyz/common/codegen";
import path from "path";
import { renderPrototypes } from "./renderPrototype";
import { renderPrototypeIndex } from "./renderPrototypeIndex";
import { ConfigWithPrototypes, PrototypesConfig, TablesInput } from "./types";

const generateIndex = async (prototypes: PrototypesConfig<TablesInput>, outputBaseDirectory: string) => {
  const output = renderPrototypeIndex(prototypes);
  const fullOutputPath = path.join(outputBaseDirectory, `Prototypes.sol`);

  await formatAndWriteSolidity(output, fullOutputPath, "");
};

const generatePrototypes = async (config: ConfigWithPrototypes, outputBaseDirectory: string) => {
  const output = renderPrototypes(config);
  const name = "All";
  const fullOutputPath = path.join(outputBaseDirectory, `prototypes/${name}Prototype.sol`);
  await formatAndWriteSolidity(output, fullOutputPath, `Generated prototype ${name}`);
};

export async function prototypegen(config: ConfigWithPrototypes, outputBaseDirectory: string) {
  generateIndex(config.prototypeConfig, outputBaseDirectory);
  generatePrototypes(config, outputBaseDirectory);
}
