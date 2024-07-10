import { Core } from "@core/lib/types";

import { namespaceWorld } from "@primodiumxyz/reactive-tables";

export const setupDoubleCounter = (core: Core) => {
  const {
    network: { world },
    tables,
  } = core;

  const systemWorld = namespaceWorld(world, "coreSystems");

  tables.Counter.watch({
    world: systemWorld,
    onChange: (update) => {
      const value = update?.properties.current?.value ?? 0;
      tables.DoubleCounter.set({ value: BigInt(value) * BigInt(2) });
    },
  });
};
