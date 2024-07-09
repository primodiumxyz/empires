import { formatTime } from "@primodiumxyz/core";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const TimeLeft = () => {
  const { timeLeft, gameOver } = useTimeLeft();
  return (
    <div className="absolute top-4 flex w-72 flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      {gameOver ? <p>Game Over</p> : <p>Round ends in {formatTime(timeLeft)} </p>}
    </div>
  );
};
