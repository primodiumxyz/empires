import { ContractWrite } from "@latticexyz/common";
import type CallWithSignatureAbi from "@latticexyz/world-modules/out/Unstable_CallWithSignatureSystem.sol/Unstable_CallWithSignatureSystem.abi.json";
import { ReplaySubject, Subject } from "rxjs";
import {
  Account,
  Address,
  CustomTransport,
  FallbackTransport,
  GetContractReturnType,
  Hex,
  PublicClient,
  TransactionReceipt,
  WalletClient,
} from "viem";

import { IWorldAbiType, mudConfig } from "@primodiumxyz/contracts";
import { AllTableDefs, ContractTables, Entity, World, WrapperResult } from "@primodiumxyz/reactive-tables";
import type AdminAbi from "@core/lib/AdminAbi.abi.json";
import { ChainConfig } from "@core/network/config/chainConfigs";
import { otherTableDefs } from "@core/network/otherTableDefs";
import { Recs } from "@core/recs/setupRecs";
import { createSync } from "@core/sync";
import setupCoreTables from "@core/tables/coreTables";
import { SyncTables } from "@core/tables/syncTables";
import { createUtils } from "@core/utils";

/**
 * Core configuration
 */
export type CoreConfig = {
  /**
   * Chain configuration. Default configurations can be found in the {@link chainConfigs object chainConfigs} object
   */
  chain: ChainConfig;
  worldAddress: Address;
  initialBlockNumber?: bigint;

  /**
   * Used to automatically drip eth to accounts in dev mode.
   *
   * If using anvil, this value is 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   */
  devPrivateKey?: Hex;
  /**
   * Used to fetch player ens names
   */
  accountLinkUrl?: string;

  /**
   * Run the default initial sync? (default: false)
   *
   * If using RPC, will hydrate full game state.
   * If using indexer, default sync only fetches prototype data and player data (if playerAddress is set)
   */
  runSync?: boolean;
  /**
   * Run the default initial systems? (default: false)
   *
   * Setups up systems to keep core tables and simplified tables in sync with contract tables
   */
  runSystems?: boolean;
  /**
   * Enable dev tools (default: false)
   *
   * If enabled, this will mount dev tools from Reactive Tables into the app, effectively showing a button
   * in the bottom right corner of the screen that opens the dev tools UI.
   */
  devTools?: boolean;
};

type MudConfig = typeof mudConfig;

/**
 * @typedef {Object} CreateNetworkResult
 * @property {World} world - The world instance.
 * @property {MudConfig} mudConfig - Configuration for MUD.
 * @property {PublicClient<FallbackTransport, ChainConfig, undefined>} publicClient - The public client.
 * @property {Clock} clock - The clock instance.
 * @property {WrapperResult<MudConfig, typeof otherTableDefs>} - The wrapper result containing all tables and their definitions and the storage adapter.
 *
 * Contains contract table metadata.
 *
 * See [mud.config.ts](https://github.com/primodiumxyz/contracts/blob/main/mud.config.ts#L85-L97) for more details.
 */

export type CreateNetworkResult = Omit<Recs<MudConfig, typeof otherTableDefs>, "tables"> & {
  /** @property {World} world - The world instance. */
  world: World;
  mudConfig: MudConfig;
  publicClient: PublicClient<FallbackTransport, ChainConfig, undefined>;
  clock: Clock;
} & Omit<
    WrapperResult<MudConfig, typeof otherTableDefs> & {
      tables: ContractTables<AllTableDefs<MudConfig, typeof otherTableDefs>> & SyncTables;
    },
    "triggerUpdateStream"
  >;

export type Tables = CreateNetworkResult["tables"] & ReturnType<typeof setupCoreTables>;
export type Utils = ReturnType<typeof createUtils>;
export type Sync = ReturnType<typeof createSync>;

/**
 * Core object
 * @typedef {Object} Core
 * @property {CoreConfig} config - Chain configuration. Default configurations can be found in the {@link chainConfigs object chainConfigs} object
 * @property {CreateNetworkResult} network - Network configuration
 * @property {Tables} tables - Tables contain data and methods to interact with game state. See [reactive tables](
 * @property {Utils} utils - Utility functions
 * @property {Sync} sync - Sync functions
 */

export type Core = {
  /**
   * Chain configuration. Default configurations can be found in the {@link chainConfigs object chainConfigs} object
   */
  config: CoreConfig;
  network: CreateNetworkResult;
  /** Tables contain data and methods to interact with game state. See [reactive tables](https://github.com/primodiumxyz/reactive-tables) */
  tables: Tables;
  utils: Utils;
  sync: Sync;
};

export type Clock = {
  currentTime: number;
  lastUpdateTime: number;
  time$: ReplaySubject<number>;
  dispose: () => void;
  update: (time: number) => void;
};

/**
 * World Abi. Combination of IWorld abi and CallWithSignature abi.
 */

export type WorldAbiType = typeof IWorldAbiType & typeof CallWithSignatureAbi & typeof AdminAbi;

type _Account<
  IsLocalAccount extends boolean = false,
  TPublicClient extends PublicClient = PublicClient<FallbackTransport, ChainConfig>,
  TWalletClient extends WalletClient = IsLocalAccount extends true
    ? WalletClient<FallbackTransport, ChainConfig, Account>
    : WalletClient<CustomTransport, ChainConfig, Account>,
> = {
  worldContract: GetContractReturnType<
    WorldAbiType,
    {
      public: TPublicClient;
      wallet: TWalletClient;
    },
    Address
  >;
  account: Account;
  address: Address;
  publicClient: TPublicClient;
  walletClient: TWalletClient;
  entity: Entity;
  write$: Subject<ContractWrite>;
  privateKey: IsLocalAccount extends true ? Hex : null;
};

export type ExternalAccount = _Account<false>;
export type LocalAccount = _Account<true>;

export interface AccountClient {
  playerAccount: ExternalAccount | LocalAccount;
  setPlayerAccount: (options: { playerAddress?: Address; playerPrivateKey?: Hex }) => void;
}

export enum SyncSourceType {
  Indexer,
  RPC,
}

export enum SyncStep {
  Syncing,
  Error,
  Complete,
  Live,
}

export type CartesionCoord = {
  x: number;
  y: number;
};

export type AxialCoord = {
  q: number;
  r: number;
};

export type AxialCoordBigInt = {
  q: bigint;
  r: bigint;
};

export type TxReceipt =
  | (TransactionReceipt & {
      success: boolean;
      error?: string;
    })
  | {
      success: false;
      error: string;
    };
