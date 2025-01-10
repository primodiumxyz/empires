import { Core } from "@core/lib/types";

import { namespaceWorld } from "@primodiumxyz/reactive-tables";
import { systems } from "@primodiumxyz/reactive-tables/utils";

const { defineRxSystem } = systems;

export function setupTime({
  tables,
  network: {
    world,
    clock: { time$ },
  },
}: Core) {
  const systemWorld = namespaceWorld(world, "coreSystems");
  defineRxSystem(systemWorld, time$, (time) => {
    tables.Time.set({ value: BigInt(time) });
  });
}
