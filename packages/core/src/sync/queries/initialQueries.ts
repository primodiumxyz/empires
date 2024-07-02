import { Hex } from "viem";

import { DecodedIndexerQuery } from "@primodiumxyz/sync-stack/types";
import { Tables } from "@core/lib";

export const getInitialQuery = ({
  tables,
  worldAddress,
}: {
  tables: Tables;
  worldAddress: Hex;
}): DecodedIndexerQuery => {
  //get all the tables that start with P_
  const configTableQueries = [...Object.keys(tables)]
    .filter((key) => key.startsWith("P_"))
    .map((tableName) => ({ tableId: tables[tableName].id }));

  return {
    address: worldAddress as Hex,
    queries: [
      ...configTableQueries,
      {
        tableId: tables.Planet.id,
      },
      {
        tableId: tables.Faction.id,
      },
    ],
  };
};
