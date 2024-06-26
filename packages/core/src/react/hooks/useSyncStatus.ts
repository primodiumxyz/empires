import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { useCore } from "./useCore";
import { SyncSourceType, SyncStep } from "@/lib/types";
import { useEffect, useState } from "react";

/**
 * Provides the sync status of a given sync id.
 *
 * @param syncId - The ID of the entity to sync.
 * @returns An object containing the sync status information.
 */
export const useSyncStatus = (syncId?: Entity) => {
  const { tables } = useCore();
  const syncSource = tables.SyncSource.use()?.value;
  const syncEntity = syncSource === SyncSourceType.RPC ? defaultEntity : syncId;
  const syncStatus = tables.SyncStatus.use(syncEntity)?.step;
  const syncProgress = tables.SyncStatus.use(syncEntity)?.progress;
  const syncMessage = tables.SyncStatus.use(syncEntity)?.message;

  const [loading, setLoading] = useState(
    syncStatus ? syncStatus !== SyncStep.Complete && syncStatus !== SyncStep.Live : true
  );
  const [error, setError] = useState(syncStatus === SyncStep.Error);

  //TODO: sync with time updates
  useEffect(() => {
    if (syncStatus === undefined) return;
    if (syncStatus === SyncStep.Complete || syncStatus === SyncStep.Live) {
      setLoading(false);
      setError(false);
    } else if (syncStatus === SyncStep.Error) {
      setLoading(false);
      setError(true);
    } else {
      setLoading(true);
      setError(false);
    }
  }, [syncSource, syncStatus]);

  return {
    loading,
    error,
    progress: syncProgress ?? 0,
    message: syncMessage,
    exists: !!syncStatus,
  };
};
