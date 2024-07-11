import { Hex } from "viem";

import { ContractTableDefs } from "@primodiumxyz/reactive-tables";
import { DecodedIndexerQuery } from "@primodiumxyz/sync-stack/types";

export const getSecondaryQuery = ({
  tables,
  worldAddress,
}: {
  tables: ContractTableDefs;
  worldAddress: Hex;
}): DecodedIndexerQuery => {
  tables;
  return {
    address: worldAddress,
    queries: [],
  };
};
