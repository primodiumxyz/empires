import { useState } from "react";
import { cva, VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";

import { cn } from "@/util/client";

export type TooltipDirection = "right" | "left" | "top" | "bottom" | "center" | "topRight" | "topLeft";

const tooltipTranslation = {
  top: {
    x: "-50%",
    y: 0,
  },
  left: {
    x: "-100%",
    y: "50%",
  },
  right: {
    x: "0%",
    y: "50%",
  },
  bottom: {
    x: "-50%",
    y: "100%",
  },
  center: {
    x: "0",
    y: "0",
  },
  topRight: {
    x: "0",
    y: "-120%",
  },
  topLeft: {
    x: "-100%",
    y: "-120%",
  },
};

const tooltipVariants = cva(" pointer-events-auto", {
  variants: {
    direction: {
      top: "left-1/2 -top-12",
      left: "bottom-1/2",
      right: "bottom-1/2 left-full",
      bottom: "left-1/2",
      center: "",
      topRight: "",
      topLeft: "",
    },
  },
  defaultVariants: {
    direction: "top",
  },
});

interface TooltipProps extends React.ButtonHTMLAttributes<HTMLDivElement>, VariantProps<typeof tooltipVariants> {
  tooltipContent?: React.ReactNode;
  show?: boolean;
  rotate?: boolean;
  containerClassName?: string;
  enabled?: boolean;
}

export const Tooltip = ({
  className,
  tooltipContent,
  children,
  direction,
  show = false,
  containerClassName,
  enabled = true,
}: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(0); // going to set this value on mouse move
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const halfWidth = event.target?.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth); // set the x value, which is then used in transform and rotate
  };

  if (!tooltipContent || !enabled) return children;

  return (
    <div
      onMouseMove={handleMouseMove}
      onPointerEnter={() => setVisible(true)}
      onPointerLeave={() => setVisible(false)}
      className={cn("relative", containerClassName)}
    >
      {(visible || show) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.6, x: tooltipTranslation[direction ?? "top"].x, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: tooltipTranslation[direction ?? "top"].y,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.6 }}
            className={cn(
              tooltipVariants({ direction }),
              "pixel-border absolute z-50 flex w-fit flex-col items-center justify-center bg-neutral p-3 text-xs shadow-xl heropattern-graphpaper-slate-800/50",
              className,
            )}
          >
            {tooltipContent}
          </motion.div>
        </AnimatePresence>
      )}

      {children}
    </div>
  );
};
