import { worldsJson } from "@primodiumxyz/contracts";
import { chainConfigs, CoreConfig } from "@primodiumxyz/core";

const worlds = worldsJson as Partial<
  Record<string, { address: string; blockNumber?: number }>
>;

export const getCoreConfig = (): CoreConfig => {
  // Ignore deployment URL params on production subdomains (primodium.com)

  const chainId = "dev";

  const chain = chainConfigs[chainId];

  const world = worlds[chain.id];
  const worldAddress = world?.address;
  if (!worldAddress) {
    throw new Error(`No world address found for chain ${chainId}. `);
  }
  const initialBlockNumber = world?.blockNumber ?? 0;

  const config: CoreConfig = {
    chain,
    worldAddress: worldAddress as `0x${string}`,
    initialBlockNumber: BigInt(initialBlockNumber),
    runSync: true,
    runSystems: true,
  };

  return config;
};
