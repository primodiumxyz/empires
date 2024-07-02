import { CreateNetworkResult, Tables } from "@/lib/types";
import createCoreTables from "@/tables/coreTables";

export function createTables(network: CreateNetworkResult): Tables {
  const coreTables = createCoreTables(network);

  return {
    ...network.tables,
    ...coreTables,
  };
}
