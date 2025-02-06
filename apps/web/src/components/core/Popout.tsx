import { useEffect, useRef, useState } from "react";
import { cva, VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";

import { cn } from "@/util/client";

export type PopoutDirection = "right" | "left" | "top" | "bottom" | "center" | "topRight" | "topLeft";

const popoutTranslation = {
  top: {
    x: "-50%",
    y: "-95%",
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

const popoutVariants = cva(" pointer-events-auto", {
  variants: {
    direction: {
      top: "left-1/2",
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

interface PopoutProps extends React.ButtonHTMLAttributes<HTMLDivElement>, VariantProps<typeof popoutVariants> {
  popoutContent?: React.ReactNode;
  rotate?: boolean;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  containerClassName?: string;
  enabled?: boolean;
}

export const Popout = ({
  className,
  popoutContent,
  children,
  direction,
  visible = false,
  setVisible = (v: boolean) => {},
  containerClassName,
  enabled = true,
}: PopoutProps) => {
  const x = useMotionValue(0);
  const popoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const contains = popoutRef.current?.contains(event.target as Node);

      if (popoutRef.current && !popoutRef.current.contains(event.target as Node)) {
        setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!popoutContent || !enabled) return children;

  return (
    <div ref={popoutRef} className={cn("relative", containerClassName)}>
      {visible && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: popoutTranslation[direction ?? "top"].x, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: popoutTranslation[direction ?? "top"].y,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className={cn(
              popoutVariants({ direction }),
              "absolute z-50 flex w-fit flex-col items-center justify-center bg-neutral rounded-md p-2 shadow-[0_0_10px_rgba(255,255,255,0.2)]",
              className,
            )}
          >
            {popoutContent}
          </motion.div>
        </AnimatePresence>
      )}

      {children}
    </div>
  );
};
