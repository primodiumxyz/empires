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
  Empires__createShip: getSystemId("OverrideShipSystem"),
  Empires__chargeShield: getSystemId("OverrideShieldSystem"),
  Empires__sellPoints: getSystemId("OverridePointsSystem"),
  Empires__airdropGold: getSystemId("OverrideAirdropSystem"),
  Empires__detonateShieldEater: getSystemId("OverrideShieldEaterSystem"),
  Empires__placeAcid: getSystemId("OverrideAcidSystem"),

  Empires__updateWorld: getSystemId("UpdateSystem"),

  Empires__resetGame: getSystemId("ResetSystem"),

  Empires__withdrawEarnings: getSystemId("RewardsSystem"),

  Empires__placeMagnet: getSystemId("OverrideMagnetsSystem"),

  /* ----------------------------------- Dev ---------------------------------- */
  Empires__devSetField: getSystemId("DevSystem"),
  Empires__devDeleteRecord: getSystemId("DevSystem"),

  Empires__pause: getSystemId("AdminSystem"),
  Empires__unpause: getSystemId("AdminSystem"),
  Empires__setRole: getSystemId("AdminSystem"),
  Empires__removeRole: getSystemId("AdminSystem"),
  Empires__setGameConfig: getSystemId("AdminSystem"),
  Admin__withdrawRake: getSystemId("WithdrawRakeSystem", "Admin"),
};
