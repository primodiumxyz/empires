import { useCallback } from "react";

import { Channel } from "@primodiumxyz/engine";
import { SecondaryCard } from "@/components/core/Card";
import { Navigator } from "@/components/core/Navigator";
import { Range } from "@/components/core/Range";
import { useGame } from "@/hooks/useGame";

export const AudioSettings = () => {
  const game = useGame();

  const masterVolume = game.ROOT.hooks.useVolume("master");
  const musicVolume = game.ROOT.hooks.useVolume("music");
  const sfxVolume = game.ROOT.hooks.useVolume("sfx");
  const uiVolume = game.ROOT.hooks.useVolume("ui");

  console.log({ masterVolume, musicVolume, sfxVolume, uiVolume });

  const setChannelVolume = useCallback(
    (amount: number, channel: Channel | "master") => {
      game.ROOT.audio.setVolume(amount, channel);
      game.UI.audio.setVolume(amount, channel);
      game.MAIN.audio.setVolume(amount, channel);
    },
    [game],
  );

  return (
    <Navigator.Screen title="audio">
      <SecondaryCard className="w-full space-y-5">
        <div>
          <p className="pb-1 text-xs font-bold text-accent opacity-50">MASTER</p>
          <Range
            min={0}
            max={100}
            defaultValue={masterVolume * 100}
            className="range-accent"
            onChange={(e) => {
              setChannelVolume(e / 100, "master");
            }}
          />
        </div>
        <div>
          <p className="range-xs pb-1 text-xs font-bold opacity-50">MUSIC</p>
          <Range
            min={0}
            max={100}
            defaultValue={musicVolume * 100}
            className="range-xs"
            onChange={(e) => {
              setChannelVolume(e / 100, "music");
            }}
          />
        </div>
        <div>
          <p className="pb-1 text-xs font-bold opacity-50">SFX</p>
          <Range
            min={0}
            max={100}
            defaultValue={sfxVolume * 100}
            className="range-xs"
            onChange={(e) => {
              setChannelVolume(e / 100, "sfx");
            }}
          />
        </div>
        <div>
          <p className="pb-1 text-xs font-bold opacity-50">UI</p>
          <Range
            min={0}
            max={100}
            defaultValue={uiVolume * 100}
            className="range-xs"
            onChange={(e) => {
              setChannelVolume(e / 100, "ui");
            }}
          />
        </div>
      </SecondaryCard>
      <Navigator.BackButton className="mt-2" />
    </Navigator.Screen>
  );
};
