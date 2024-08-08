import { Core, hashEntities } from "@primodiumxyz/core";
import { Key } from "@primodiumxyz/engine";
import { KeybindActionKeys } from "@primodiumxyz/game";
import { createLocalTable, Entity, Type } from "@primodiumxyz/reactive-tables";

type Keybinds = Partial<{
  [key in KeybindActionKeys]: Set<Key>;
}>;

const defaultKeybinds: Keybinds = {
  RightClick: new Set(["POINTER_RIGHT"]),
  LeftClick: new Set(["POINTER_LEFT"]),
  Up: new Set(["W", "UP"]),
  Down: new Set(["S", "DOWN"]),
  Left: new Set(["A", "LEFT"]),
  Right: new Set(["D", "RIGHT"]),
  Base: new Set(["SPACE"]),
  Cycle: new Set(["TAB"]),
  ZoomIn: new Set(["X", "PLUS"]),
  ZoomOut: new Set(["Z", "MINUS"]),
  Modifier: new Set(["SHIFT"]),
  Hotbar0: new Set(["ONE"]),
  Hotbar1: new Set(["TWO"]),
  Hotbar2: new Set(["THREE"]),
  Hotbar3: new Set(["FOUR"]),
  Hotbar4: new Set(["FIVE"]),
  Hotbar5: new Set(["SIX"]),
  Hotbar6: new Set(["SEVEN"]),
  Hotbar7: new Set(["EIGHT"]),
  Hotbar8: new Set(["NINE"]),
  Hotbar9: new Set(["ZERO"]),
  NextHotbar: new Set(["E"]),
  PrevHotbar: new Set(["Q"]),
  Esc: new Set(["ESC"]),
  Map: new Set(["M"]),
  Console: new Set(["BACKTICK"]),
  Account: new Set(["R"]),
  Blueprints: new Set(["T"]),
  Objectives: new Set(["Y"]),
  Resources: new Set(["U"]),
  Units: new Set(["I"]),
  Aura: new Set(["O"]),
  Fleets: new Set(["P"]),
  Chat: new Set(["OPEN_BRACKET"]),
  HideAll: new Set(["H"]),
};

export function createKeybindTable(core: Core) {
  const {
    network: { world },
  } = core;
  const table = createLocalTable(
    world,
    {
      keys: Type.StringArray,
    },
    {
      id: "Keybinds",
      persist: true,
      version: hashEntities(JSON.stringify(defaultKeybinds)),
    },
  );

  function get(keybind: KeybindActionKeys) {
    const keybinds = table.get(keybind as Entity)?.keys;

    if (!keybinds) return defaultKeybinds[keybind];

    return new Set(keybinds);
  }

  return {
    ...table,
    get,
  };
}
