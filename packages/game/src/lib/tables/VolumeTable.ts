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
    },
  );

  function getAllChannels() {
    const currentVolume = table.get() ?? defaultVolume;
    return {
      master: currentVolume.master ?? defaultVolume.master,
      music: currentVolume.music ?? defaultVolume.music,
      sfx: currentVolume.sfx ?? defaultVolume.sfx,
      ui: currentVolume.ui ?? defaultVolume.ui,
    };
  }

  function get(channel: Channel | "master") {
    return table.get()[channel] ?? defaultVolume[channel];
  }

  function set(volume: number, channel: Channel | "master" = "master") {
    const currentVolume = getAllChannels();

    const newVolume = {
      ...currentVolume,
      [channel]: volume,
    } as Record<Channel | "master", number>;

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
