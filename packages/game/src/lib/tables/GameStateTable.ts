import { Core } from "@primodiumxyz/core";
import { createLocalTable, Type } from "@primodiumxyz/reactive-tables";

export function createGameStateTable(core: Core) {
  const {
    network: { world },
  } = core;
  const table = createLocalTable(
    world,
    { visible: Type.Boolean },
    {
      id: "GameState",
    },
    { visible: true },
  );

  return table;
}
