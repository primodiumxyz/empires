import { Price } from "@/components/shared/Price";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";

interface PotProps {
  className?: string;
}

export const Pot: React.FC<PotProps> = ({ className }) => {
  const { pot } = usePot();

  return (
    <div className={cn(className)}>
      <h2 className="ml-1 font-semibold opacity-70">Pot</h2>
      <Price wei={pot} className="text-xl text-accent" />
    </div>
  );
};
