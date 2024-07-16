import { Tooltip } from "@/components/core/Tooltip";
import { useGame } from "@/hooks/useGame";
import { useEffect, forwardRef, useCallback } from "react";
import { AudioKeys } from "@primodiumxyz/assets";
import { getRandomRange } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { KeybindActionKeys } from "@game/lib/constants/keybinds";
import { cn } from "@/util/client";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "btn join-item relative group pointer-events-auto min-h-fit flex items-center justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !p-0",
  {
    variants: {
      variant: {
        primary: "btn-primary ring-primary/50",
        accent: "btn-accent ring-accent/50",
        secondary: "btn-secondary ring-secondary/50",
        success: "btn-success ring-success/50",
        info: "btn-info ring-info/50",
        warning: "btn-warning ring-warning/50",
        error: "btn-error ring-error/50",
      },
      size: {
        xs: "btn-xs ring-1",
        sm: "btn-sm ring-2",
        md: "btn-md ring-4",
        lg: "btn-lg ring-4",
      },
      modifier: {
        default: "",
        outline: "btn-outline",
      },
      shape: {
        default: "w-fit",
        block: "btn-block",
        wide: "btn-wide",
        circle: "btn-circle",
        square: "btn-square",
      },
    },
    defaultVariants: {
      modifier: "default",
      variant: "secondary",
      size: "xs",
      shape: "default",
    },
  }
);

const _innerVariants = cva(
  "translate-y-[-6px] flex items-center justify-center group-active:translate-y-[0px] w-full h-full px-5 border shadow-inner heropattern-topography-slate-200/10 hover:heropattern-topography-slate-200/25 transition-all",
  {
    variants: {
      variant: {
        primary: "bg-primary border-accent/50",
        accent: "bg-accent border-accent/50",
        secondary: "bg-secondary border-accent/50",
        success: "bg-success border-white/50",
        info: "bg-info border-white/50",
        warning: "bg-warning border-white/50",
        error: "bg-error border-white/50",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  mute?: boolean;
  clickSound?: AudioKeys;
  keybind?: KeybindActionKeys;
  tooltip?: React.ReactNode;
  tooltipDirection?: "right" | "left" | "top" | "bottom";
  selected?: boolean;
}

export const PushButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      modifier,
      shape,
      mute = false,
      clickSound = "Confirm2",
      keybind,
      tooltip,
      tooltipDirection,
      selected,
      ...props
    },
    ref
  ) => {
    const game = useGame();
    const { tables } = useCore();
    const api = game.UI;

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        !mute &&
          api.audio.play(clickSound, "ui", {
            detune: getRandomRange(-100, 100),
          });

        props.onClick?.(e);
      },
      [api.audio, clickSound, mute, props]
    );

    const handleHoverEnter = useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        !mute &&
          api.audio.play("DataPoint2", "ui", {
            volume: 0.1,
            detune: getRandomRange(-200, 200),
          });

        props.onPointerEnter?.(e);
        tables.HoverEntity.remove();
      },
      [api.audio, mute, props]
    );

    useEffect(() => {
      if (!keybind || props.disabled) return;

      const listener = api.input.addListener(keybind, () => handleClick(undefined!));

      return () => {
        listener.dispose();
      };
    }, [keybind, api, clickSound, mute, props.disabled, handleClick]);

    return (
      <Tooltip tooltipContent={tooltip} direction={tooltipDirection}>
        <button
          className={cn(
            selected && "ring-1 ring-accent z-10",
            buttonVariants({ variant, size, modifier, shape, className })
          )}
          ref={ref}
          {...props}
          onClick={handleClick}
          onPointerEnter={handleHoverEnter}
        >
          <span className={cn(_innerVariants({ variant }), props.disabled && "translate-y-[0px]")}>
            {props.children}
          </span>
          {!props.disabled && (
            <div className="absolute bottom-0 left-0 h-[6px] w-full bg-black/50 bg-blend-screen group-active:h-0 transition-all duration-75" />
          )}
        </button>
      </Tooltip>
    );
  }
);
PushButton.displayName = "PushButton";
