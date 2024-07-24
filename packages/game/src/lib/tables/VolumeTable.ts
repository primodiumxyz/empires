import { Channel } from "@primodiumxyz/engine";
import { createLocalTable, Type } from "@primodiumxyz/reactive-tables";
import { hashEntities, Core } from "@primodiumxyz/core";

const defaultVolume: Record<Channel | "master", number> = {
  master: 1,
  music: 0.5,
  sfx: 0.5,
  ui: 0.5,
};

export function createVolumeTable(core: Core) {
  const {
    network: { world },
  } = core;
  const table = createLocalTable(
    world,
    {
      master: Type.Number,
      music: Type.Number,
      sfx: Type.Number,
      ui: Type.Number,
    },
    {
      id: "Volume",
      persist: true,
      version: hashEntities(JSON.stringify(defaultVolume)),
    }
  );

  function get() {
    return table.get() ?? defaultVolume;
  }

  function set(volume: number, channel: Channel | "master" = "master") {
    const currentVolume = get();
    const newVolume =
      channel === "master"
        ? {
            master: volume,
            sfx: (currentVolume.sfx ?? 1) * volume,
            music: (currentVolume.music ?? 1) * volume,
            ui: (currentVolume.ui ?? 1) * volume,
          }
        : { ...currentVolume, [channel]: (currentVolume.master ?? 1) * volume };
    table.set(newVolume);

    return newVolume;
  }

  return {
    ...table,
    get,
    set,
  };
}
