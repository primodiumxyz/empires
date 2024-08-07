import { Assets, Audio, AudioKeys } from "@primodiumxyz/assets";
import { Channel, Scene } from "@primodiumxyz/engine";
import { GlobalApi } from "@game/api/global";

export const createAudioApi = (scene: Scene, globalApi: GlobalApi) => {
  function play(key: AudioKeys, channel: Channel, config?: Phaser.Types.Sound.SoundConfig) {
    scene.audio[channel].playAudioSprite(Assets.AudioAtlas, Audio[key], {
      ...config,
    });
  }

  function initializeAudioVolume() {
    const masterVolume = globalApi.tables.Volume.get("master");
    const musicVolume = globalApi.tables.Volume.get("music");
    const sfxVolume = globalApi.tables.Volume.get("sfx");
    const uiVolume = globalApi.tables.Volume.get("ui");

    scene.audio.music.setVolume(masterVolume ?? 1 * (musicVolume ?? 1));
    scene.audio.sfx.setVolume(masterVolume ?? 1 * (sfxVolume ?? 1));
    scene.audio.ui.setVolume(masterVolume ?? 1 * (uiVolume ?? 1));
  }

  function get(key: AudioKeys, channel: Channel) {
    const playingSounds = scene.audio[channel].getAllPlaying();
    for (const sound of playingSounds) {
      if (sound.currentMarker.name === key) {
        return sound;
      }
    }
  }

  function getVolume(channel: Channel | "master" = "master") {
    return globalApi.tables.Volume.get(channel);
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
    getVolume,
    setPauseOnBlur,
    initializeAudioVolume,
  };
};
