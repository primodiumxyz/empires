import { forwardRef, HTMLAttributes } from "react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/util/client";

const loaderSizes = cva("loading loading-dots", {
  variants: {
    size: {
      sm: "loading-sm",
      xs: "loading-xs",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

interface LoaderProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof loaderSizes> {}
export const Loader = forwardRef<HTMLSpanElement, LoaderProps>(({ className, size }, ref) => {
  return <span ref={ref} className={cn(loaderSizes({ size, className }))} />;
});
