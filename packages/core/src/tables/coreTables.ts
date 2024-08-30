import {
  createLocalBigIntTable,
  createLocalBoolTable,
  createLocalEntityTable,
  createLocalTable,
  Type,
} from "@primodiumxyz/reactive-tables";
import { CreateNetworkResult } from "@core/lib/types";

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
  const HoveredPlanet = createLocalEntityTable(world, { id: "HoveredPlanet" });

  const Username = createLocalTable(
    world,
    {
      username: Type.String,
      lastFetched: Type.Number,
      hasTwitter: Type.Boolean,
    },
    {
      id: "Username",
      persist: true,
    },
  );

  const PlanetName = createLocalTable(
    world,
    {
      name: Type.String,
      lastFetched: Type.Number,
    },
    {
      id: "PlanetName",
    },
  );
  return {
    DoubleCounter,
    BlockNumber,
    Time,
    Account,
    CurrentTransaction,
    TransactionQueue,
    SelectedPlanet,
    HoveredPlanet,
    Username,
    PlanetName,
  };
}
