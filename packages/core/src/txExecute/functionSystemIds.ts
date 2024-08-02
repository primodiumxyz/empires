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
  Empires__createShip: getSystemId("OverrideSystem"),
  Empires__killShip: getSystemId("OverrideSystem"),
  Empires__chargeShield: getSystemId("OverrideSystem"),
  Empires__drainShield: getSystemId("OverrideSystem"),
  Empires__sellPoints: getSystemId("OverrideSystem"),
  Empires__tacticalStrike: getSystemId("OverrideSystem"),
  Empires__boostCharge: getSystemId("OverrideSystem"),
  Empires__stunCharge: getSystemId("OverrideSystem"),

  Empires__updateWorld: getSystemId("UpdateSystem"),

  Empires__resetGame: getSystemId("ResetSystem"),

  Empires__claimVictory: getSystemId("RewardsSystem"),
  Empires__withdrawEarnings: getSystemId("RewardsSystem"),

  Empires__placeMagnet: getSystemId("OverrideSystem"),

  Admin__withdrawRake: getSystemId("WithdrawRakeSystem", "Admin"),

  /* ----------------------------------- Dev ---------------------------------- */
  Empires__devSetField: getSystemId("DevSystem"),
};
