import { Core } from "@primodiumxyz/core";
import { createLocalTable, Type } from "@primodiumxyz/reactive-tables";

export function createGameStateTable(core: Core) {
  const {
    network: { world },
  } = core;
  const table = createLocalTable(
    world,
    { visible: Type.Boolean, onMap: Type.Boolean },
    {
      id: "GameState",
    },
  );

  table.set({ visible: true, onMap: false });

  return table;
}
