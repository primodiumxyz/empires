import { useEffect, useRef } from "react";

import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";

export const TextArea: React.FC<{
  placeholder?: string;
  className?: string;
  maxLength?: number;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  requirePattern?: string;
}> = ({ placeholder, className, maxLength, onChange, requirePattern }) => {
  const game = useGame();
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="form-control pointer-events-auto w-full max-w-xs">
      <textarea
        ref={inputRef}
        tabIndex={-1}
        onChange={onChange}
        maxLength={maxLength}
        onFocus={game.GLOBAL.disableGlobalInput}
        onBlur={game.GLOBAL.enableGlobalInput}
        required={!!requirePattern}
        placeholder={placeholder ?? "Type here"}
        className={cn("input w-full max-w-xs resize-none border-secondary/25 bg-neutral py-2", className)}
      />
    </div>
  );
};
