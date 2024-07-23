import { throttle } from "lodash";

import { Key, Scene } from "@primodiumxyz/engine";
import { KeybindActionKeys } from "@game/lib/constants/keybinds";
import { Core } from "@primodiumxyz/core";

export function createInputApi(scene: Scene, core: Core) {
  const {
    tables: { Keybinds },
  } = core;

  function isDown(keybindAction: KeybindActionKeys) {
    const { input } = scene;
    const keybinds = Keybinds.get(keybindAction);

    if (!keybinds) return false;

    if ("LeftClick" === keybindAction) {
      if (input.phaserInput.activePointer.downElement?.nodeName !== "CANVAS")
        return false;
      return input.phaserInput.activePointer.leftButtonDown();
    }

    if ("RightClick" === keybindAction) {
      if (input.phaserInput.activePointer.downElement?.nodeName !== "CANVAS")
        return false;
      return input.phaserInput.activePointer.rightButtonDown();
    }

    for (const key of keybinds) {
      if (input.phaserKeys.get(key as Key)?.isDown) {
        return true;
      }
    }

    return false;
  }

  function isUp(keybindAction: KeybindActionKeys) {
    const { input } = scene;
    const keybinds = Keybinds.get(keybindAction);

    if (!keybinds) return false;

    if ("LeftClick" === keybindAction) {
      return input.phaserInput.activePointer.leftButtonReleased();
    }

    if ("RightClick" === keybindAction) {
      return input.phaserInput.activePointer.rightButtonReleased();
    }

    for (const key of keybinds) {
      if (input.phaserKeys.get(key as Key)?.isUp) {
        return true;
      }
    }

    return false;
  }

  function addListener(
    keybindAction: KeybindActionKeys,
    callback: () => void,
    emitOnRepeat = false,
    wait = 0
  ) {
    const { input } = scene;
    const keybinds = Keybinds.get(keybindAction);

    if (!keybinds) return;

    const fn = throttle(callback, wait);

    for (const key of keybinds) {
      input.phaserKeys
        .get(key as Key)
        ?.on("down", fn)
        .setEmitOnRepeat(emitOnRepeat);
    }

    return {
      dispose: () => {
        for (const key of keybinds) {
          input.phaserKeys.get(key as Key)?.removeListener("down", fn);
        }
      },
    };
  }

  function transferListeners(oldKey: Key, newKey: Key) {
    const { input } = scene;

    const oldPhaserKey = input.phaserKeys.get(oldKey);
    const newPhaserKey = input.phaserKeys.get(newKey);

    if (!oldPhaserKey || !newPhaserKey) return;

    const events = oldPhaserKey.listeners("down");
    if (!events.length) return;

    const emitOnRepeat = oldPhaserKey.emitOnRepeat;

    oldPhaserKey.removeAllListeners();

    newPhaserKey.removeAllListeners().setEmitOnRepeat(emitOnRepeat);

    for (const event of events) {
      newPhaserKey.on("down", event);
    }
  }

  function removeListeners(key: Key) {
    const { input } = scene;

    const phaserKey = input.phaserKeys.get(key);

    if (!phaserKey) return;

    phaserKey.removeAllListeners();
  }

  function disableInput() {
    const { input } = scene;

    input.disableInput();
  }

  function enableInput() {
    const { input } = scene;

    input.enableInput();
  }

  return {
    ...scene.input,
    isDown,
    isUp,
    addListener,
    transferListeners,
    removeListeners,
    disableInput,
    enableInput,
  };
}
