import { useTimeLeft } from "@/hooks/useTimeLeft";

export const TimeLeft = () => {
  const { timeLeft, gameOver } = useTimeLeft();
  return (
    <div className="absolute top-4 flex flex-col justify-center gap-1 rounded bg-secondary p-2 text-center text-white">
      {gameOver ? <p>Game Over</p> : <p>{timeLeft} seconds left</p>}
    </div>
  );
};
