import CallWithSignatureAbi from "@latticexyz/world-modules/out/Unstable_CallWithSignatureSystem.sol/Unstable_CallWithSignatureSystem.abi.json";

import { IWorldAbi } from "@primodiumxyz/contracts";
import AdminAbi from "@core/lib/AdminAbi.abi.json";
import { WorldAbiType } from "@core/lib/types";

export const WorldAbi = [...IWorldAbi, ...CallWithSignatureAbi, ...AdminAbi] as WorldAbiType;
