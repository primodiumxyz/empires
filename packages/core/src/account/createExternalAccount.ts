import { ContractWrite, transportObserver } from "@latticexyz/common";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import { Subject } from "rxjs";
import {
  Account,
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  EIP1193Provider,
  fallback,
  getContract,
  Hex,
  http,
} from "viem";
import { toAccount } from "viem/accounts";

import { CoreConfig, ExternalAccount } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";
import { normalizeAddress } from "@core/utils/global/common";
import { addressToEntity } from "@core/utils/global/encode";

/**
 *
 * @param coreConfig configuration of core object
 * @param address address of the account
 * @returns: {@link ExternalAccount}
 */
export function createExternalAccount(
  coreConfig: CoreConfig,
  address: Address,
  options?: { provider?: EIP1193Provider },
): ExternalAccount {
  if (typeof window === "undefined") {
    throw new Error("createExternalAccount must be called in a browser environment");
  }

  const clientOptions = {
    chain: coreConfig.chain,
    pollingInterval: 1000,
    account: toAccount(address) as Account,
  };

  const publicClient = createPublicClient({
    ...clientOptions,
    transport: transportObserver(fallback([http()])),
  });
  const walletClient = createWalletClient({
    ...clientOptions,
    transport: options?.provider
      ? custom(options.provider)
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        custom((window as unknown as { ethereum: any }).ethereum),
  });

  const write$ = new Subject<ContractWrite>();
  walletClient.extend(transactionQueue()).extend(writeObserver({ onWrite: (write) => write$.next(write) }));

  const worldContract = getContract({
    address: coreConfig.worldAddress,
    abi: WorldAbi,
    client: {
      public: publicClient,
      wallet: walletClient,
    },
  });

  return {
    worldContract,
    account: walletClient.account,
    address: normalizeAddress(walletClient.account.address),
    publicClient,
    walletClient,
    entity: addressToEntity(walletClient.account.address),
    write$,
    privateKey: null,
  };
}
