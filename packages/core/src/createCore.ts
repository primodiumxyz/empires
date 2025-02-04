import { Core, CoreConfig } from "@core/lib/types";
import { createNetwork } from "@core/network/createNetwork";
import { createSync } from "@core/sync";
import { runInitialSync } from "@core/sync/runInitialSync";
import { runCoreSystems } from "@core/systems";
import { createTables } from "@core/tables/createTables";
import { createUtils } from "@core/utils/core/createUtils";

/**
 * @param config {@link CoreConfig}
 * @returns: {@link Core}
 */
export function createCore(config: CoreConfig): Core {
  const networkResult = createNetwork(config);
  const tables = createTables(networkResult);
  const utils = createUtils(tables, config);
  const sync = createSync(config, networkResult, tables);

  const core = {
    config,
    network: networkResult,
    tables,
    utils,
    sync,
  };

  if (config.runSystems && !config.runSync) throw new Error("Cannot run systems without running sync");
  if (config.runSync) {
    console.log("Running initial sync");
    runInitialSync(core).then(() => {
      if (config.runSystems) {
        console.log("Running core systems");
        runCoreSystems(core);
      }

      console.log("Syncing action logs");
      sync.syncActionLogs();
    });
  }

  return core;
}
