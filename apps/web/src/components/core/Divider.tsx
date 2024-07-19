import { cn } from "@/util/client";

export const Divider: React.FC<{
  className?: string;
  children?: React.ReactNode;
  direction?: "horizontal" | "vertical";
}> = ({ className, children, direction = "horizontal" }) => {
  return (
    <div
      className={cn(
        "divider border border-secondary",
        direction === "horizontal" ? "divider-horizontal" : "divider-vertical",
        className,
      )}
    >
      {children}
    </div>
  );
};
