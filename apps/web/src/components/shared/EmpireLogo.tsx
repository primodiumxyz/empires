import { EEmpire } from "@primodiumxyz/contracts";
import { useEmpireLogo } from "@/hooks/useEmpireLogo";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const EmpireLogo = ({
  empireId,
  size = "md",
  className,
}: {
  empireId: EEmpire;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) => {
  const empireLogo = useEmpireLogo(empireId);
  const bgColor = EmpireEnumToConfig[empireId].bgColor;
  const borderColor = EmpireEnumToConfig[empireId].borderColor;
  return (
    <img
      src={empireLogo}
      className={cn(
        "aspect-square w-10 rounded-sm border p-[4px]",
        size === "xs" && "w-6",
        size === "sm" && "w-8",
        size === "lg" && "w-12",
        size === "xl" && "w-16",
        borderColor,
        className,
      )}
    />
  );
};
