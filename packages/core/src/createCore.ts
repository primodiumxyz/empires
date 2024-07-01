import { createTables } from "@/tables/createTables";
import { createNetwork } from "@/network/createNetwork";
import { runInitialSync } from "@/sync/runInitialSync";
import { CoreConfig, Core } from "@/lib/types";
import { createUtils } from "@/utils/core/createUtils";
import { createSync } from "@/sync";
import { runCoreSystems } from "@/systems";

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
