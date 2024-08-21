import { useEffect, useRef, useState } from "react";
import { MusicalNoteIcon, PauseIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/core/Button";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";
import { getNextSong, getRandomSong } from "@/util/soundtrack";

export const MusicPlayer = ({ className }: { className?: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [song, setSong] = useState(getRandomSong());
  const MusicPlaying = useSettings().MusicPlaying;
  const isPlaying = MusicPlaying.use()?.value ?? true;

  const {
    ROOT: { hooks },
  } = useGame();
  const volume = hooks.useVolume("music");
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [audioRef, volume]);
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    if (userInteracted && audioRef.current) {
      handlePlay();
    }
  }, [userInteracted]);

  const handlePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
    MusicPlaying.set({ value: true });
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    MusicPlaying.set({ value: false });
  };

  const handleUpdate = () => {
    if (!audioRef.current) return;
    //go to next song if current song is done
    if (audioRef.current.ended) {
      setSong(getNextSong(song));
    }

    if (audioRef.current.paused && isPlaying) {
      MusicPlaying.set({ value: false });
    }

    if (!audioRef.current.paused && !isPlaying) {
      MusicPlaying.set({ value: true });
    }
  };

  return (
    <div className={cn("group pointer-events-auto relative text-sm", className)}>
      <div className={cn("flex items-center gap-2 transition-all", !isPlaying && "opacity-70")}>
        {!isPlaying ? (
          <Button variant="ghost" shape="square" size="xs" onClick={handlePlay}>
            <PauseIcon />
          </Button>
        ) : (
          <Button variant="ghost" shape="square" size="xs" onClick={handlePause}>
            <MusicalNoteIcon />
          </Button>
        )}
      </div>

      <audio
        ref={audioRef}
        src={song.url}
        muted={volume === 0}
        title={song.title}
        autoPlay
        onTimeUpdate={handleUpdate}
      />
    </div>
  );
};
