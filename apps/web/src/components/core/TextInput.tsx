import { useEffect, useRef } from "react";

import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";

export const TextInput: React.FC<{
  topLeftLabel?: string;
  bottomLeftLabel?: string;
  topRightLabel?: string;
  bottomRightLabel?: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  requirePattern?: string;
}> = ({
  placeholder,
  topLeftLabel,
  topRightLabel,
  bottomLeftLabel,
  bottomRightLabel,
  className,
  maxLength,
  value,
  onChange,
  requirePattern,
}) => {
  const game = useGame();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscPress = (event: KeyboardEvent) => {
      if (!inputRef.current || event.key !== "Escape") return;

      inputRef.current.blur();
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!inputRef.current || inputRef.current.contains(event.target as Node)) return;

      inputRef.current.blur();
    };

    document.addEventListener("keydown", handleEscPress);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscPress);
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={cn(
        "form-control pointer-events-auto w-full max-w-xs",
        // if className includes a custom width, extract it and pass it to the form-control
        className && className.includes("w-") && className.split(" ").find((c) => c.includes("w-")),
      )}
    >
      {topLeftLabel || topRightLabel ? (
        <label className="label">
          {topLeftLabel && <span className="label-text opacity-90">{topLeftLabel}</span>}
          {topRightLabel && <span className="label-text-alt opacity-75">{topRightLabel}</span>}
        </label>
      ) : null}
      <input
        ref={inputRef}
        type="text"
        tabIndex={-1}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        onFocus={game.GLOBAL.disableGlobalInput}
        onBlur={game.GLOBAL.enableGlobalInput}
        required={!!requirePattern}
        pattern={requirePattern}
        placeholder={placeholder ?? "Type here"}
        className={cn("input w-full max-w-xs border-secondary/25 bg-neutral", className)}
      />
      {bottomLeftLabel || bottomRightLabel ? (
        <label className="label">
          {bottomLeftLabel && <span className="label-text-alt opacity-75">{bottomLeftLabel}</span>}
          {bottomRightLabel && <span className="label-text-alt opacity-75"> {bottomRightLabel} </span>}
        </label>
      ) : null}
    </div>
  );
};
