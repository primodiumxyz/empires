import { ContractWrite, createBurnerAccount, transportObserver } from "@latticexyz/common";
import { transactionQueue, writeObserver } from "@latticexyz/common/actions";
import { Subject } from "rxjs";
import { Hex, createPublicClient, createWalletClient, fallback, getContract, http } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { CoreConfig, LocalAccount } from "@/lib/types";
import { STORAGE_PREFIX } from "@/lib/constants";
import { WorldAbi } from "@/lib/WorldAbi";
import { normalizeAddress } from "@/utils/global/common";
import { addressToEntity } from "@/utils/global/encode";
import { storage } from "@/utils/global/storage";

/**
 *
 * @param coreConfig configuration of core object
 * @param privateKey private key of the session account. If not provided, a new private key will be generated
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

  const sessionWalletClient = createWalletClient({
    ...clientOptions,
    account: localAccount,
  });

  const write$ = new Subject<ContractWrite>();
  sessionWalletClient.extend(transactionQueue()).extend(writeObserver({ onWrite: (write) => write$.next(write) }));

  const sessionWorldContract = getContract({
    address: coreConfig.worldAddress as Hex,
    abi: WorldAbi,
    client: {
      public: publicClient,
      wallet: sessionWalletClient,
    },
  });
  return {
    worldContract: sessionWorldContract,
    account: sessionWalletClient.account,
    address: normalizeAddress(sessionWalletClient.account.address),
    publicClient,
    walletClient: sessionWalletClient,
    entity: addressToEntity(sessionWalletClient.account.address),
    privateKey: key,
    write$,
  };
}
