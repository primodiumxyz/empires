import {
  createLocalBigIntTable,
  createLocalBoolTable,
  createLocalEntityTable,
  createLocalNumberTable,
  createLocalTable,
  Type,
} from "@primodiumxyz/reactive-tables";
import { EViewMode } from "@core/lib";
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
      version: "1",
    },
  );

  const ViewMode = createLocalNumberTable(world, { id: "ViewMode", persist: true, version: "1" });
  // set default value
  if (!ViewMode.get()?.value) ViewMode.set({ value: EViewMode.Map });

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

  const EmpireLogo = createLocalTable(
    world,
    {
      uri: Type.String,
      lastFetched: Type.Number,
    },
    {
      id: "EmpireName",
    },
  );

  const Slippage = createLocalTable(
    world,
    {
      customValue: Type.Number,
      isAuto: Type.Boolean,
      autoValue: Type.Number,
    },
    { id: "Slippage", persist: true },
  );
  if (!Slippage.get()?.autoValue) Slippage.set({ isAuto: true, autoValue: 5, customValue: 0 });

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
    ViewMode,
    PlanetName,
    EmpireLogo,
    Slippage,
  };
}
