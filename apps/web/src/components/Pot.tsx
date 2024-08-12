import { Card } from "@/components/core/Card";
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
      <Card noDecor>
        <div className="flex flex-col justify-center gap-2 text-center">
          {/* Pot */}
          <div className="flex flex-col justify-center">
            <div className="flex flex-row items-center justify-center gap-3">
              <p className="text-left text-sm font-bold uppercase">Pot </p>
              <Price wei={pot} className="text-xs" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
