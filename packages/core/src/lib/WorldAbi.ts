import CallWithSignatureAbi from "@latticexyz/world-modules/out/Unstable_CallWithSignatureSystem.sol/Unstable_CallWithSignatureSystem.abi.json";
import { WorldAbiType } from "@core/lib/types";
import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json";

export const WorldAbi = [...IWorldAbi, ...CallWithSignatureAbi] as WorldAbiType;
