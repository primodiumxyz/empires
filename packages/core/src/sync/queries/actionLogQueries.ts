import { Hex } from "viem";

import { DecodedIndexerQuery } from "@primodiumxyz/sync-stack/types";
import { Core } from "@core/lib";

export const getActionLogQuery = ({
  tables,
  worldAddress,
}: {
  tables: Core["network"]["tableDefs"];
  worldAddress: Hex;
}): DecodedIndexerQuery => {
  return {
    address: worldAddress as Hex,
    queries: [
      // Logs
      { tableId: tables.MoveRoutineLog.tableId },
      { tableId: tables.PlanetBattleRoutineLog.tableId },
      { tableId: tables.BuyShipsRoutineLog.tableId },
      { tableId: tables.BuyShieldsRoutineLog.tableId },
      { tableId: tables.AccumulateGoldRoutineLog.tableId },
      { tableId: tables.CreateShipOverrideLog.tableId },
      { tableId: tables.ChargeShieldsOverrideLog.tableId },
      { tableId: tables.PlaceMagnetOverrideLog.tableId },
      { tableId: tables.ShieldEaterDetonateOverrideLog.tableId },
      { tableId: tables.ShieldEaterDamageOverrideLog.tableId },
      { tableId: tables.PlaceAcidOverrideLog.tableId },
      { tableId: tables.AcidDamageOverrideLog.tableId },
      { tableId: tables.AirdropGoldOverrideLog.tableId },
      { tableId: tables.SellPointsOverrideLog.tableId },
    ],
  };
};
