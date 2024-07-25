import { GlobalApi } from "@game/api/global";
import { Assets, Audio, AudioKeys } from "@primodiumxyz/assets";
import { Scene } from "@primodiumxyz/engine";

import { Channel } from "@primodiumxyz/engine";

export const createAudioApi = (scene: Scene, globalApi: GlobalApi) => {
  function play(
    key: AudioKeys,
    channel: Channel,
    config?: Phaser.Types.Sound.SoundConfig
  ) {
    scene.audio[channel].playAudioSprite(Assets.AudioAtlas, Audio[key], {
      ...config,
    });
  }

  function initializeAudioVolume() {
    const volume = globalApi.tables.Volume.get();

    scene.audio.music.setVolume(volume?.master ?? 1 * (volume?.music ?? 1));
    scene.audio.sfx.setVolume(volume?.master ?? 1 * (volume?.sfx ?? 1));
    scene.audio.ui.setVolume(volume?.master ?? 1 * (volume?.ui ?? 1));
  }

  function get(key: AudioKeys, channel: Channel) {
    const playingSounds = scene.audio[channel].getAllPlaying();
    for (const sound of playingSounds) {
      if (sound.currentMarker.name === key) {
        return sound;
      }
    }
  }

  function setVolume(volume: number, channel: Channel | "master" = "master") {
    const newVolume = globalApi.tables.Volume.set(volume, channel);

    scene.audio.music.setVolume(newVolume.music ?? 1);
    scene.audio.sfx.setVolume(newVolume.sfx ?? 1);
    scene.audio.ui.setVolume(newVolume.ui ?? 1);
  }

  function setPauseOnBlur(pause: boolean) {
    scene.audio.music.pauseOnBlur = pause;
    scene.audio.sfx.pauseOnBlur = pause;
    scene.audio.ui.pauseOnBlur = pause;
  }

  return {
    ...scene.audio,
    play,
    get,
    setVolume,
    setPauseOnBlur,
    initializeAudioVolume,
  };
};
