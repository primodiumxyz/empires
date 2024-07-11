import { hexToResource } from "@latticexyz/common";
import { Account, Address, Chain, Hex, toHex, Transport, WalletClient } from "viem";
import { signTypedData } from "viem/actions";

import { Core } from "@core/lib";

type SignCallOptions = {
  core: Core;
  userAccountClient: WalletClient<Transport, Chain, Account>;
  worldAddress: Address;
  systemId: Hex;
  callData: Hex;
  nonce?: bigint | null;
};

const callWithSignatureTypes = {
  Call: [
    { name: "signer", type: "address" },
    { name: "systemNamespace", type: "string" },
    { name: "systemName", type: "string" },
    { name: "callData", type: "bytes" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

//TODO: improve the devex by making the systemId and call data typesafe
export async function signCall({
  core: { tables, config },
  userAccountClient,
  worldAddress,
  systemId,
  callData,
  nonce: initialNonce,
}: SignCallOptions) {
  const nonce =
    initialNonce ??
    tables.CallWithSignatureNonces.getWithKeys({ signer: userAccountClient.account.address })?.nonce ??
    0n;

  const { namespace: systemNamespace, name: systemName } = hexToResource(systemId);

  const chainId = config.chain.id;
  return await signTypedData(userAccountClient, {
    account: userAccountClient.account,
    domain: {
      verifyingContract: worldAddress,
      salt: toHex(chainId, { size: 32 }),
    },
    types: callWithSignatureTypes,
    primaryType: "Call",
    message: {
      signer: userAccountClient.account.address,
      systemNamespace,
      systemName,
      callData,
      nonce,
    },
  });
}
