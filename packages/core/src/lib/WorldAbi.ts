import CallWithSignatureAbi from "@latticexyz/world-modules/out/Unstable_CallWithSignatureSystem.sol/Unstable_CallWithSignatureSystem.abi.json";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";

import { WorldAbiType } from "@/lib/types";

export const WorldAbi = [...IWorldAbi, ...CallWithSignatureAbi] as WorldAbiType;
