import { useEffect, useRef, useState } from "react";
import { BackwardIcon, ForwardIcon, MusicalNoteIcon, PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";
import { getNextSong, getPrevSong, getRandomSong } from "@/util/soundtrack";

export const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [song, setSong] = useState(getRandomSong());
  const [isPlaying, setIsPlaying] = useState(false);

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
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleNext = () => {
    if (audioRef.current) {
      setSong(getNextSong(song));
    }
  };

  const handlePrev = () => {
    if (audioRef.current) {
      setSong(getPrevSong(song));
    }
  };

  const handleUpdate = () => {
    if (audioRef.current) {
      //go to next song if current song is done
      if (audioRef.current.ended) {
        setSong(getNextSong(song));
      }

      if (audioRef.current.paused && isPlaying) {
        setIsPlaying(false);
      }

      if (!audioRef.current.paused) {
        if (!isPlaying) setIsPlaying(true);
      }
    }
  };

  return (
    <div className={cn("group pointer-events-auto relative w-5/6 text-sm")}>
      <div className={cn("flex items-center gap-2 transition-all group-hover:opacity-15", !isPlaying && "opacity-15")}>
        <MusicalNoteIcon className={cn("w-6", isPlaying && "animate-pulse")} />
        <div className="marquee relative flex grow">
          <div className="marquee-text flex">
            <div className="flex px-1">
              <p className="font-bold">{song.title}-</p>
              <p className="opacity-70">{song.artist}</p>
            </div>
          </div>
          <div className="marquee-text2 absolute top-0 flex gap-2">
            <div className="flex px-1">
              <p className="font-bold">{song.title}-</p>
              <p className="opacity-70">{song.artist}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-0 flex w-full items-center justify-center opacity-0 transition-all group-hover:opacity-100",
          !isPlaying && "opacity-100",
        )}
      >
        <div className="flex">
          <Button variant="ghost" shape="square" size="xs" onClick={handlePrev}>
            <BackwardIcon />
          </Button>
          {isPlaying ? (
            <Button variant="ghost" shape="square" size="xs" onClick={handlePause}>
              <PauseIcon />
            </Button>
          ) : (
            <Button variant="ghost" shape="square" size="xs" onClick={handlePlay}>
              <PlayIcon />
            </Button>
          )}
          <Button variant="ghost" shape="square" size="xs" onClick={handleNext}>
            <ForwardIcon />
          </Button>
        </div>
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
