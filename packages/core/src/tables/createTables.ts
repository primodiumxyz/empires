import { CreateNetworkResult, Tables } from "@core/lib/types";
import createCoreTables from "@core/tables/coreTables";

export function createTables(network: CreateNetworkResult): Tables {
  const coreTables = createCoreTables(network);

  return {
    ...network.tables,
    ...coreTables,
  };
}
