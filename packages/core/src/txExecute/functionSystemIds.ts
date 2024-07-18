import { ContractFunctionName, Hex } from "viem";

import { WorldAbiType } from "@core/lib";
import { getSystemId } from "@core/utils";

export const functionSystemIds: {
  [functionName in ContractFunctionName<WorldAbiType>]?: Hex;
} = {
  /* ------------------------------- Delegation ------------------------------- */
  // callWithSignature: getSystemId("Registration", "CORE"),
  registerDelegation: getSystemId("Registration", "CORE"),
  unregisterDelegation: getSystemId("Registration", "CORE"),

  /* -------------------------------- Gameplay -------------------------------- */
  Empires__createShip: getSystemId("ActionSystem"),
  Empires__killShip: getSystemId("ActionSystem"),
  Empires__updateWorld: getSystemId("UpdateSystem"),
  Empires__resetGame: getSystemId("ResetSystem"),

  Empires__claimVictory: getSystemId("RewardsSystem"),
  Empires__withdrawEarnings: getSystemId("RewardsSystem"),

  Empires__sellPoints: getSystemId("ActionSystem"),

  Admin__withdrawRake: getSystemId("WithdrawRakeSystem", "Admin"),

  /* ----------------------------------- Dev ---------------------------------- */
  Empires__devSetField: getSystemId("DevSystem"),
};
