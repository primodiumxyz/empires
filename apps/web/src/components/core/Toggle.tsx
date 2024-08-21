import { cn } from "@/util/client";

export const Toggle: React.FC<{
  className?: string;
  defaultChecked?: boolean;
  onToggle?: () => void;
  label?: string;
}> = ({ className, defaultChecked = false, onToggle, label }) => {
  return (
    <div
      className={cn(
        "form-control pointer-events-auto h-fit w-fit flex-row items-center gap-2 p-2 transition-all hover:bg-secondary/25",
        className,
      )}
    >
      {label && (
        <label className="label cursor-pointer whitespace-nowrap pr-0" onClick={() => onToggle?.()}>
          {label}
        </label>
      )}
      <input
        type="checkbox"
        className="toggle cursor-pointer"
        defaultChecked={defaultChecked}
        onClick={() => onToggle?.()}
      />
    </div>
  );
};
