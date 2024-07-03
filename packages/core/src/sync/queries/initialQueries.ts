import { Hex } from "viem";

import { DecodedIndexerQuery } from "@primodiumxyz/sync-stack/types";
import { Core } from "@core/lib";

export const getInitialQuery = ({
  tables,
  worldAddress,
}: {
  tables: Core["network"]["tableDefs"];
  worldAddress: Hex;
}): DecodedIndexerQuery => {
  //get all the tables that start with P_
  const configTableQueries = Object.keys(tables)
    .filter((key) => key.startsWith("P_"))
    //@ts-expect-error - tableName does exist in tables
    .map((tableName) => ({ tableId: tables[tableName].tableId }));

  return {
    address: worldAddress,
    queries: [...configTableQueries, { tableId: tables.Planet.tableId }, { tableId: tables.Turn.tableId }],
  };
};
