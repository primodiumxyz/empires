import { cn } from "@/util/client";
import { useEffect, useRef } from "react";
import { useGame } from "@/hooks/useGame";

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
    <div className="form-control w-full max-w-xs pointer-events-auto">
      <textarea
        ref={inputRef}
        tabIndex={-1}
        onChange={onChange}
        maxLength={maxLength}
        onFocus={game.GLOBAL.disableGlobalInput}
        onBlur={game.GLOBAL.enableGlobalInput}
        required={!!requirePattern}
        placeholder={placeholder ?? "Type here"}
        className={cn("input w-full max-w-xs py-2 bg-neutral border-secondary/25 resize-none", className)}
      />
    </div>
  );
};
