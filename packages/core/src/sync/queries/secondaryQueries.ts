import { ContractTableDefs } from "@primodiumxyz/reactive-tables";
import { DecodedIndexerQuery } from "@primodiumxyz/sync-stack/types";
import { Hex } from "viem";

export const getSecondaryQuery = ({
  tables,
  worldAddress,
}: {
  tables: ContractTableDefs;
  worldAddress: Hex;
}): DecodedIndexerQuery => {
  tables;
  return {
    address: worldAddress as Hex,
    queries: [],
  };
};
