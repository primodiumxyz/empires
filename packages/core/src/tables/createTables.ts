import createCoreTables from "@/tables/coreTables";
import { CreateNetworkResult, Tables } from "@/lib/types";

export function createTables(network: CreateNetworkResult): Tables {
  const coreTables = createCoreTables(network);

  return {
    ...network.tables,
    ...coreTables,
  };
}
