import { forwardRef } from "react";

import { cn } from "@/util/client";

export const Loader = ({
  className,
  size = "loading-sm",
}: {
  className?: string;
  size?: "loading-sm" | "loading-xs";
}) => {
  return <p className={cn("h-4", size, className)} />;
};
