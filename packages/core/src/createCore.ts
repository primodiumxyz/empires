import { Core, CoreConfig } from "@/lib/types";
import { createNetwork } from "@/network/createNetwork";
import { createSync } from "@/sync";
import { runInitialSync } from "@/sync/runInitialSync";
import { runCoreSystems } from "@/systems";
import { createTables } from "@/tables/createTables";
import { createUtils } from "@/utils/core/createUtils";

/**
 *
 * @param config {@link CoreConfig}
 * @returns: {@link Core}
 */
export function createCore(config: CoreConfig): Core {
  const networkResult = createNetwork(config);
  const tables = createTables(networkResult);
  const utils = createUtils(tables);
  const sync = createSync(config, networkResult, tables);

  const core = {
    config,
    network: networkResult,
    tables,
    utils,
    sync,
  };

  if (config?.runSystems && !config.runSync) throw new Error("Cannot run systems without running sync");
  if (config?.runSync) {
    runInitialSync(core).then(() => {
      if (config?.runSystems) runCoreSystems(core);
    });
  }

  return core;
}
