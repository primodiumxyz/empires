import { Price } from "@/components/shared/Price";
import { cn } from "@/util/client";

interface KPICardProps {
  title: string;
  value: bigint;
  size?: "sm" | "lg";
  percentageChange?: bigint;
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, percentageChange, size = "lg" }) => {
  return (
    <div className="flex flex-col rounded-box bg-black/10 p-2">
      <h3 className="text-gray-4000 mb-1 text-xs">{title}</h3>

      <Price
        wei={value}
        className={cn("font-bold", value > 0 ? "text-success" : "text-error", size === "sm" ? "text-sm" : "text-lg")}
      />
      {size == "lg" && <Price wei={value} forceBlockchainUnits className="text-sm opacity-50" />}

      {percentageChange !== undefined && (
        <p className={cn("text-sm", percentageChange >= 0 ? "text-success" : "text-error")}>
          {(Number(percentageChange) / 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
};
