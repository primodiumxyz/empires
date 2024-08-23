import { Core } from "@primodiumxyz/core";
import { createGameStateTable } from "@game/lib/tables/GameStateTable";
import { createKeybindTable } from "@game/lib/tables/KeybindTable";
import { createVolumeTable } from "@game/lib/tables/VolumeTable";

export const createGameTables = (core: Core) => {
  const Keybinds = createKeybindTable(core);
  const Volume = createVolumeTable(core);
  const GameState = createGameStateTable(core);

  return {
    Keybinds,
    Volume,
    GameState,
  };
};
