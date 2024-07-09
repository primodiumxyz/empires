import { ContractWrite, createBurnerAccount, transportObserver } from "@latticexyz/common";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import { STORAGE_PREFIX } from "@core/lib/constants";
import { CoreConfig, LocalAccount } from "@core/lib/types";
import { WorldAbi } from "@core/lib/WorldAbi";
import { normalizeAddress } from "@core/utils/global/common";
import { addressToEntity } from "@core/utils/global/encode";
import { storage } from "@core/utils/global/storage";
import { Subject } from "rxjs";
import { createPublicClient, createWalletClient, fallback, getContract, Hex, http } from "viem";
import { generatePrivateKey } from "viem/accounts";

/**
 *
 * @param coreConfig configuration of core object
 * @param privateKey private key of the local account. If not provided, a new private key will be generated
 * @param saveToStorage (browser only) whether to save the private key to local storage (default: true)
 * @returns: {@link LocalAccount}
 */
export function createLocalAccount(coreConfig: CoreConfig, privateKey?: Hex, saveToStorage = true): LocalAccount {
  const key = privateKey ?? generatePrivateKey();
  const localAccount = createBurnerAccount(key);
  if (saveToStorage) storage.setItem(STORAGE_PREFIX + localAccount.address, key);
  const clientOptions = {
    chain: coreConfig.chain,
    transport: transportObserver(fallback([http()])),
    pollingInterval: 1000,
  };

  const publicClient = createPublicClient(clientOptions);

  const localWalletClient = createWalletClient({
    ...clientOptions,
    account: localAccount,
  });

  const write$ = new Subject<ContractWrite>();
  localWalletClient.extend(transactionQueue()).extend(writeObserver({ onWrite: (write) => write$.next(write) }));

  const localWorldContract = getContract({
    address: coreConfig.worldAddress as Hex,
    abi: WorldAbi,
    client: {
      public: publicClient,
      wallet: localWalletClient,
    },
  });
  return {
    worldContract: localWorldContract,
    account: localWalletClient.account,
    address: normalizeAddress(localWalletClient.account.address),
    publicClient,
    walletClient: localWalletClient,
    entity: addressToEntity(localWalletClient.account.address),
    privateKey: key,
    write$,
  };
}
