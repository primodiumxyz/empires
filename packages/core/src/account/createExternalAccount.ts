import { CoreConfig, ExternalAccount } from "@/lib/types";
import { WorldAbi } from "@/lib/WorldAbi";
import { normalizeAddress } from "@/utils/global/common";
import { addressToEntity } from "@/utils/global/encode";
import { ContractWrite, transportObserver } from "@latticexyz/common";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import { Subject } from "rxjs";
import {
  Account,
  Address,
  EIP1193Provider,
  Hex,
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  getContract,
  http,
} from "viem";
import { toAccount } from "viem/accounts";

/**
 *
 * @param coreConfig configuration of core object
 * @param address address of the account
 * @returns: {@link ExternalAccount}
 */
export function createExternalAccount(
  coreConfig: CoreConfig,
  address: Address,
  options?: { provider?: EIP1193Provider }
): ExternalAccount {
  if (typeof window === "undefined") {
    throw new Error(
      "createExternalAccount must be called in a browser environment"
    );
  }

  const clientOptions = {
    chain: coreConfig.chain,
    pollingInterval: 1000,
    account: toAccount(address) as Account,
  };

  console.log({ clientOptions });

  const publicClient = createPublicClient({
    ...clientOptions,
    transport: transportObserver(fallback([http()])),
  });
  const walletClient = createWalletClient({
    ...clientOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: options?.provider
      ? custom(options.provider)
      : custom((window as unknown as { ethereum: any }).ethereum),
  });

  const write$ = new Subject<ContractWrite>();
  walletClient
    .extend(transactionQueue())
    .extend(writeObserver({ onWrite: (write) => write$.next(write) }));

  const worldContract = getContract({
    address: coreConfig.worldAddress as Hex,
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
