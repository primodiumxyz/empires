import { createLocalNumberTable, createLocalTable, Type, World } from "@primodiumxyz/reactive-tables";

export type SyncTables = ReturnType<typeof setupSyncTables>;
export function setupSyncTables(world: World) {
  const SyncSource = createLocalNumberTable(world, { id: "SyncSource" });
  const SyncStatus = createLocalTable(
    world,
    {
      step: Type.Number,
      message: Type.String,
      progress: Type.Number,
      lastBlockNumberProcessed: Type.BigInt,
    },
    {
      id: "SyncStatus",
    },
  );

  return {
    SyncSource,
    SyncStatus,
  };
}
