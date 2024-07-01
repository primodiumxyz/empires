import { resourceToHex } from "@latticexyz/common";

const UserDelegationControlTableId = resourceToHex({ type: "table", namespace: "", name: "UserDelegationControl" });
const CallWithSignatureNoncesTableId = resourceToHex({ type: "table", namespace: "", name: "CallWithSignatur" });

/**
 * Other tables that are registered after deployed and therefore are not part of the core tables
 */
export const otherTableDefs = {
  UserDelegationControl: {
    namespace: "world",
    name: "UserDelegationControl",
    tableId: UserDelegationControlTableId,
    keySchema: {
      delegator: { type: "address" },
      delegatee: { type: "address" },
    },
    valueSchema: {
      delegationControlId: {
        type: "bytes32",
      },
    },
  },
  CallWithSignatureNonces: {
    namespace: "world",
    name: "CallWithSignatureNonces",
    tableId: CallWithSignatureNoncesTableId,
    keySchema: {
      signer: { type: "address" },
    },
    valueSchema: {
      nonce: {
        type: "uint256",
      },
    },
  },
} as const;
