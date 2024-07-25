import { createKeybindTable } from "@game/lib/tables/KeybindTable";
import { createVolumeTable } from "@game/lib/tables/VolumeTable";
import { Core } from "@primodiumxyz/core";

export const createGameTables = (core: Core) => {
  const Keybinds = createKeybindTable(core);
  const Volume = createVolumeTable(core);

  return {
    Keybinds,
    Volume,
  };
};
