import { useCallback, useEffect, useState } from "react";

import { Channel } from "@primodiumxyz/engine";
import { SecondaryCard } from "@/components/core/Card";
import { Navigator } from "@/components/core/Navigator";
import { Range } from "@/components/core/Range";
import { useGame } from "@/hooks/useGame";

export const AudioSettings = () => {
  const game = useGame();

  const [volume, setVolume] = useState<Record<Channel | "master", number>>({
    master: 0,
    music: 0,
    sfx: 0,
    ui: 0,
  });

  useEffect(() => {
    setVolume({
      master: game.ROOT.audio.getVolume("master"),
      music: game.ROOT.audio.getVolume("music"),
      sfx: game.ROOT.audio.getVolume("sfx"),
      ui: game.ROOT.audio.getVolume("ui"),
    });
  }, [game]);

  const setChannelVolume = useCallback(
    (amount: number, channel: Channel | "master") => {
      game.ROOT.audio.setVolume(amount, channel);
      game.UI.audio.setVolume(amount, channel);
      game.MAIN.audio.setVolume(amount, channel);
      setVolume({ ...volume, [channel]: amount });
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
            defaultValue={volume.master * 100}
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
            defaultValue={volume.music * 100}
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
            defaultValue={volume.sfx * 100}
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
            defaultValue={volume.ui * 100}
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
