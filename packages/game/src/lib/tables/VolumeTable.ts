import { Core, hashEntities } from "@primodiumxyz/core";
import { Channel } from "@primodiumxyz/engine";
import { createLocalTable, Type } from "@primodiumxyz/reactive-tables";

export const defaultVolume: Record<Channel | "master", number> = {
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

  function getAllChannels() {
    const currentVolume = table.get() ?? defaultVolume;
    return {
      master: currentVolume.master,
      music: currentVolume.music,
      sfx: currentVolume.sfx,
      ui: currentVolume.ui,
    };
  }

  function get(channel: Channel | "master") {
    const currentVolume = table.get()[channel] ?? defaultVolume[channel];
    const masterVolume = table.get().master ?? defaultVolume.master;
    if (channel === "master") return currentVolume;
    return currentVolume * masterVolume;
  }

  function set(volume: number, channel: Channel | "master" = "master") {
    const currentVolume = get();

    const newVolume = {
      ...currentVolume,
      [channel]:
        channel === "master" ? volume : (currentVolume.master ?? 1) * volume,
    };

    console.log({ volume, newVolume, channel, currentVolume });
    table.set(newVolume);

    return newVolume;
  }

  return {
    ...table,
    get,
    getAllChannels,
    get,
    set,
  };
}
