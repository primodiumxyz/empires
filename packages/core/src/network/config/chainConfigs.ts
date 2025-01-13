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

const baseSepolia: ChainConfig = {
  name: "Base Sepolia",
  id: 84532,
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      // this gets exposed in the client anyway, so it's easier to put it here directly for the keeper as well
      http: ["https://base-sepolia.g.alchemy.com/v2/kXmXpqsmAXqJpHyIH7YYcmK5tHaakTNx"],
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

const base: ChainConfig = {
  name: "Base",
  id: 8453,
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: {
    default: {
      // this gets exposed in the client anyway, so it's easier to put it here directly for the keeper as well
      http: ["https://base-mainnet.g.alchemy.com/v2/kXmXpqsmAXqJpHyIH7YYcmK5tHaakTNx"],
    },
    public: {
      http: ["https://mainnet.base.org"],
    },
  },
  faucetUrl: "https://base-faucet.primodium.ai/trpc",
  indexerUrl: "https://empires-indexer.primodium.ai",
  keeperUrl: "https://empires-keeper.primodium.ai/trpc",
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://basescan.org/",
    },
  },
};

export type ChainConfig = MUDChain & { indexerUrl?: string; keeperUrl?: string };

export const chainConfigs = {
  caldera,
  calderaSepolia,
  base,
  baseSepolia,
  dev,
  garnet: garnet as ChainConfig,
  redstone: redstone as ChainConfig,
} as const;
