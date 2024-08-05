import { forwardRef, useCallback, useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { AudioKeys } from "@primodiumxyz/assets";
import { getRandomRange } from "@primodiumxyz/core";
import { KeybindActionKeys } from "@primodiumxyz/game";
import { Tooltip, TooltipDirection } from "@/components/core/Tooltip";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";

const buttonVariants = cva(
  "btn join-item items-center justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none relative",
  {
    variants: {
      variant: {
        neutral: "btn-neutral border-2 border-secondary/50",
        primary: "btn-primary",
        accent: "btn-accent border border-neutral",
        secondary: "btn-secondary border border-accent",
        success: "btn-success",
        info: "btn-info border-white/50",
        warning: "btn-warning",
        error: "btn-error border border-error",
        ghost: "btn-ghost",
      },
      size: {
        xs: "btn-xs",
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
        content: "h-fit",
      },
      modifier: {
        default: "",
        outline: "btn-outline",
      },
      shape: {
        default: "",
        block: "btn-block",
        wide: "btn-wide",
        circle: "btn-circle",
        square: "btn-square",
      },
      motion: {
        enabled: "hover:translate-y-[-2px] hover:shadow-xl transition-all",
        disabled: "",
      },
    },
    defaultVariants: {
      modifier: "default",
      motion: "enabled",
      variant: "neutral",
      size: "xs",
      shape: "default",
    },
  },
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  mute?: boolean;
  clickSound?: AudioKeys;
  keybind?: KeybindActionKeys;
  tooltip?: React.ReactNode;
  tooltipDirection?: TooltipDirection;
  selected?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      modifier,
      shape,
      motion,
      mute = false,
      clickSound = "Bleep7",
      keybind,
      tooltip,
      tooltipDirection,
      selected,

      ...props
    },
    ref,
  ) => {
    const game = useGame();
    const api = game.UI;

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        !mute &&
          api.audio.play(clickSound, "ui", {
            detune: getRandomRange(-100, 100),
          });

        props.onClick?.(e);
      },
      [api.audio, clickSound, mute, props],
    );

    const handleHoverEnter = useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        !mute &&
          api.audio.play("DataPoint2", "ui", {
            volume: 0.1,
            detune: getRandomRange(-200, 200),
          });

        props.onPointerEnter?.(e);
      },
      [api.audio, mute, tooltip, props],
    );

    useEffect(() => {
      if (!keybind || !api || props.disabled) return;

      const listener = api.input.addListener(keybind, () => handleClick(undefined!));

      return () => {
        listener?.dispose();
      };
    }, [keybind, api, clickSound, mute, props.disabled, handleClick]);

    return (
      <Tooltip tooltipContent={tooltip} direction={tooltipDirection}>
        <button
          className={cn(
            "pointer-events-auto cursor-pointer active:cursor-pointerDown disabled:opacity-50",
            buttonVariants({ variant, size, motion, modifier, shape, className }),
            selected && "border-1 z-10 border-accent",
          )}
          ref={ref}
          tabIndex={-1}
          {...props}
          onClick={handleClick}
          onPointerEnter={handleHoverEnter}
        >
          {props.children}
        </button>
      </Tooltip>
    );
  },
);
Button.displayName = "Button";
