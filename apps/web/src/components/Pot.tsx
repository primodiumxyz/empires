import { Price } from "@/components/shared/Price";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

import useWinningEmpire from "@/hooks/useWinningEmpire";

interface PotProps {
  className?: string;
  small?: boolean;
}

export const Pot: React.FC<PotProps> = ({ className }) => {
  const { pot } = usePot();
  const { gameOver } = useWinningEmpire();

  if (pot <= 100000n || gameOver) {
    return (
      <div className={cn(className)}>
        <h2 className="ml-1 font-semibold opacity-70">Pot</h2>
        <h3 className={cn("text-xl text-accent")}> ---</h3>
      </div>
    );
  }
  else {
    return (
      <div className={cn(className)}>
        <h2 className="ml-1 font-semibold opacity-70">Pot</h2>
        <Price wei={pot} className={cn("text-xl text-accent")} />
      </div>
    );
  }

};
