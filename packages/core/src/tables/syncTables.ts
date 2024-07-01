import { createLocalTable, createLocalNumberTable, Type, World } from "@primodiumxyz/reactive-tables";

export type SyncTables = ReturnType<typeof setupSyncTables>;
export function setupSyncTables(world: World) {
  const SyncSource = createLocalNumberTable(world, { id: "SyncSource" });
  const SyncStatus = createLocalTable(
    world,
    {
      step: Type.Number,
      message: Type.String,
      progress: Type.Number,
    },
    {
      id: "SyncStatus",
    }
  );

  return {
    SyncSource,
    SyncStatus,
  };
}
