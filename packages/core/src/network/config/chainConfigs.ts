import { garnet, MUDChain, mudFoundry, redstone } from "@latticexyz/common/chains";

const dev: ChainConfig = {
  ...mudFoundry,
  //COMMENT OUT INDEXER URL TO USE ONLY RPC
  indexerUrl: "http://localhost:3001",
  keeperUrl: "http://localhost:3002/trpc",
};

const caldera: ChainConfig = {
  name: "Caldera",
  id: 12523,
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      http: ["https://primodium-bedrock.calderachain.xyz/replica-http"],
      // webSocket: ["wss://primodium-bedrock.calderachain.xyz/replica-ws"],
    },
    public: {
      http: ["https://primodium-bedrock.calderachain.xyz/replica-http"],
      // webSocket: ["wss://primodium-bedrock.calderachain.xyz/replica-ws"],
    },
  },
  faucetUrl: "https://caldera-faucet.primodium.ai/trpc",
  indexerUrl: "https://caldera-mud2-indexer.primodium.ai/trpc",
  keeperUrl: "https://keeper.primodium.ai/trpc",
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://primodium-bedrock.calderaexplorer.xyz/",
    },
  },
};

const calderaSepolia: ChainConfig = {
  name: "Caldera Sepolia",
  id: 10017,
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      http: ["https://primodium-sepolia.rpc.caldera.xyz/http"],
    },
    public: {
      http: ["https://primodium-sepolia.rpc.caldera.xyz/http"],
    },
  },
  faucetUrl: "https://caldera-sepolia-faucet.primodium.ai/trpc",
  indexerUrl: "https://empires-indexer.primodium.ai",
  keeperUrl: "https://keeper.primodium.ai/trpc",
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://primodium-sepolia.explorer.caldera.xyz/",
    },
  },
};

const baseSepoliaRpcUrl =
  // @ts-expect-error env doesn't exist on import.meta
  (typeof process !== "undefined" ? process.env.PRI_BASE_SEPOLIA_RPC_URL : import.meta.env.PRI_BASE_SEPOLIA_RPC_URL) ||
  "https://sepolia.base.org";

const baseSepolia: ChainConfig = {
  name: "Base Sepolia",
  id: 84532,
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      http: [baseSepoliaRpcUrl],
    },
    public: {
      http: ["https://sepolia.base.org"],
    },
  },
  faucetUrl: "https://base-sepolia-faucet.primodium.ai/trpc",
  indexerUrl: "https://empires-base-sepolia-indexer.primodium.ai",
  keeperUrl: "https://keeper.primodium.ai/trpc",
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://sepolia.basescan.org/",
    },
  },
};

export type ChainConfig = MUDChain & { indexerUrl?: string; keeperUrl?: string };

export const chainConfigs = {
  caldera,
  calderaSepolia,
  baseSepolia,
  dev,
  garnet: garnet as ChainConfig,
  redstone: redstone as ChainConfig,
} as const;
