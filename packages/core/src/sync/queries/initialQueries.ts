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
    queries: [
      // Config
      ...configTableQueries,
      { tableId: tables.FunctionSelectors.tableId },
      { tableId: tables.FunctionSignatures.tableId },
      { tableId: tables.Role.tableId },
      { tableId: tables.Ready.tableId },
      // Base
      { tableId: tables.Planet.tableId },
      { tableId: tables.Empire.tableId },
      { tableId: tables.Turn.tableId },
      { tableId: tables.WinningEmpire.tableId },
      // Overrides
      { tableId: tables.OverrideCost.tableId },
      { tableId: tables.ShieldEater.tableId },
      { tableId: tables.Magnet.tableId },
      { tableId: tables.MagnetTurnPlanets.tableId },
      { tableId: tables.Value_AcidPlanetsSet.tableId },
      // Points
      { tableId: tables.Value_PlayersMap.tableId },
      { tableId: tables.Value_PointsMap.tableId },
      { tableId: tables.HistoricalPointPrice.tableId },
      // Routines
      { tableId: tables.PendingMove.tableId },
      // Metadata
      { tableId: tables.Keys_EmpirePlanetsSet.tableId },
      { tableId: tables.Keys_PlanetsSet.tableId },
      { tableId: tables.Keys_PointsMap.tableId },
      { tableId: tables.Keys_CitadelPlanetsSet.tableId },
      { tableId: tables.Meta_EmpirePlanetsSet.tableId },
      { tableId: tables.Meta_PointsMap.tableId },
    ],
  };
};
