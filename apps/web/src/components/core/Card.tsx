import { CSSProperties, forwardRef, HTMLAttributes, MouseEvent, ReactNode, useCallback, useRef } from "react";
import { cva, VariantProps } from "class-variance-authority";

import { lerp } from "@primodiumxyz/core";
import { cn } from "@/util/client";

/* ---------------------------------- CARD ---------------------------------- */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  noDecor?: boolean;
  noPointerEvents?: boolean;
  fragment?: boolean;
  noMotion?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, noDecor = false, fragment = false, noMotion = false, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isInBoundingBox = mouseX >= left && mouseX <= left + width && mouseY >= top && mouseY <= top + height;

      if (!isInBoundingBox) {
        containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
        return;
      }

      const x = lerp(e.clientX - left - width / 2, -width, width, -1000 / width, 1000 / width);
      const y = lerp(e.clientY - top - height / 2, -height, height, -1000 / height, 1000 / height);
      containerRef.current.style.transform = `rotateY(${-x}deg) rotateX(${y}deg)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
      if (!containerRef.current) return;
      containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
    }, []);

    if (fragment)
      return (
        <div
          // className={`h-full`}
          style={{
            perspective: "1000px",
            transformStyle: "preserve-3d",
          }}
          ref={ref}
          {...props}
        >
          <div
            ref={containerRef}
            {...(!noMotion
              ? {
                  onMouseMove: handleMouseMove,
                  onMouseLeave: handleMouseLeave,
                }
              : {})}
            className={cn("overflow-visible", className)}
          >
            {children}
          </div>
        </div>
      );

    return (
      <div
        ref={ref}
        // className={`h-full`}
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          ref={containerRef}
          {...(!noMotion
            ? {
                onMouseMove: handleMouseMove,
                onMouseLeave: handleMouseLeave,
              }
            : {})}
          className={cn(
            "card relative rounded-box border border-secondary bg-neutral bg-opacity-90 p-3 transition-all duration-100 ease-linear",
            props.noPointerEvents ? "pointer-events-none" : "pointer-events-auto",
            className,
          )}
        >
          <div className="absolute inset-0 rounded-box bg-gradient-to-br from-transparent to-neutral" />
          <div className="z-50 h-full w-full">{children}</div>
          {!noDecor && (
            <div className="pointer-events-none opacity-30">
              <img src="img/ui/decor1.png" className="absolute -right-6 bottom-0" />
              <img src="img/ui/decor2.png" className="absolute -bottom-4" />
              <div className="absolute -right-6 top-0">
                <img src="img/ui/decor1.png" />
                <img src="img/ui/decor3.png" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

/* ----------------------------- SECONDARY CARD ----------------------------- */
const secondaryCardVariants = cva("card p-2", {
  variants: {
    variant: {
      default: "bg-gradient-to-br from-secondary/15 to-secondary/5 border border-secondary/25 ",
      highlight: "bg-transparent border border-accent",
    },
    noDecor: {
      true: "",
      false: "hover:shadow-2xl hover:border-secondary/50",
    },
    noPointerEvents: {
      true: "pointer-events-none",
      false: "pointer-events-auto",
    },
  },
  defaultVariants: {
    variant: "default",
    noDecor: false,
    noPointerEvents: false,
  },
});

interface SecondaryCardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof secondaryCardVariants> {}

export const SecondaryCard = forwardRef<HTMLDivElement, SecondaryCardProps>(
  ({ children, className, variant, noDecor, noPointerEvents, ...props }, ref) => {
    return (
      <div ref={ref} {...props} className={cn(secondaryCardVariants({ variant, noDecor, noPointerEvents }), className)}>
        {children}
      </div>
    );
  },
);

/* ------------------------------- GLASS CARD ------------------------------- */
const glassProps = cva("card border border-secondary/50 heropattern-topography-slate-500/10 backdrop-blur-md p-3", {
  variants: {
    direction: {
      left: "rounded-l-xl border-l-accent",
      right: "rounded-r-xl border-r-accent",
      top: "rounded-t-xl border-t-accent",
      bottom: "rounded-b-xl border-b-accent",
    },
    noPointerEvents: {
      true: "pointer-events-none",
      false: "pointer-events-auto",
    },
  },
  defaultVariants: {
    noPointerEvents: false,
  },
});
interface GlassProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof glassProps> {}

export const GlassCard = forwardRef<HTMLDivElement, GlassProps>(
  ({ children, className, direction, noPointerEvents }, ref) => {
    return (
      <div ref={ref} className={cn(glassProps({ direction, className, noPointerEvents }))}>
        <div
          className={cn(
            "absolute inset-0 !border-none !bg-gradient-to-br from-secondary/25 to-secondary/15",
            glassProps({ direction }),
          )}
        />
        {children}
      </div>
    );
  },
);
