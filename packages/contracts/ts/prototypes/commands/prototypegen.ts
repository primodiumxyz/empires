import { getSrcDirectory } from "@latticexyz/common/foundry";
import path from "path";
import { configInputs } from "../../../mud.config";
import { prototypegen } from "../prototypegen";

const srcDirectory = await getSrcDirectory();

prototypegen(configInputs, path.join(srcDirectory, "codegen"));
