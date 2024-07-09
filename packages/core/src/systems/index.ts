import { Core } from "@core/lib/types";
import { setupBlockNumber } from "@core/systems/setupBlockNumber";
import { setupDoubleCounter } from "@core/systems/setupDoubleCounter";
import { setupTime } from "@core/systems/setupTime";

export function runCoreSystems(core: Core) {
  core.network.world.dispose("coreSystems");

  setupBlockNumber(core);
  setupDoubleCounter(core);
  setupTime(core);
}
