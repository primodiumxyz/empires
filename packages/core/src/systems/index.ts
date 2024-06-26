import { Core } from "@/lib/types";
import { setupBlockNumber } from "@/systems/setupBlockNumber";
import { setupDoubleCounter } from "@/systems/setupDoubleCounter";
import { setupSync } from "@/systems/setupSync";
import { setupTime } from "@/systems/setupTime";

export function runCoreSystems(core: Core) {
  core.network.world.dispose("coreSystems");

  setupBlockNumber(core);
  setupDoubleCounter(core);
  setupSync(core);
  setupTime(core);
}
