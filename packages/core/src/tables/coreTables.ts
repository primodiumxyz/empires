import {
  createLocalBigIntTable,
  createLocalBoolTable,
  createLocalEntityTable,
  createLocalNumberTable,
  createLocalTable,
  Type,
} from "@primodiumxyz/reactive-tables";
import { CreateNetworkResult } from "@core/lib/types";
import { createKeybindTable } from "@core/tables/customTables/KeybindTable";
import { createVolumeTable } from "@core/tables/customTables/VolumeTable";

import { createTransactionQueueTable } from "./customTables/TransactionQueueTable";

export default function setupCoreTables(network: CreateNetworkResult) {
  const world = network.world;

  const DoubleCounter = createLocalBigIntTable(world, { id: "DoubleCounter" });

  const BlockNumber = createLocalTable(
    world,
    {
      value: Type.BigInt,
      avgBlockTime: Type.Number,
    },
    {
      id: "BlockNumber",
    },
  );

  const Time = createLocalBigIntTable(world, { id: "Time" });
  const Account = createLocalEntityTable(world, { id: "Account" });
  const CurrentTransaction = createLocalBoolTable(world, {
    id: "CurrentTransaction",
  });

  const TransactionQueue = createTransactionQueueTable(network, {
    id: "TransactionQueue",
  });

  const SelectedPlanet = createLocalEntityTable(world, { id: "SelectedPlanet" });
  const SelectedTab = createLocalNumberTable(world, {
    id: "SelectedTab",
    persist: true,
    version: "1",
  });
  const Keybinds = createKeybindTable(network);
  const Volume = createVolumeTable(network);

  return {
    DoubleCounter,
    BlockNumber,
    Time,
    Account,
    CurrentTransaction,
    TransactionQueue,
    SelectedPlanet,
    SelectedTab,
    Keybinds,
    Volume,
  };
}
