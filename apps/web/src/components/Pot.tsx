import { Price } from "@/components/shared/Price";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

interface PotProps {
  className?: string;
}

export const Pot: React.FC<PotProps> = ({ className }) => {
  const { pot } = usePot();

  return (
    <div className={cn("text-center", className)}>
      <h2 className="font-semibold">Pot</h2>
      <Price wei={pot} className="text-2xl text-accent" />
    </div>
  );
};
