import { cn } from "@/util/client";
import React from "react";

// A single radio button created from `RadioGroup` below
const RadioButton: React.FC<{
  id: string;
  name: string;
  label?: string;
  bottomLabel?: string;
  checked?: boolean;
  className?: string;
  onChange?: () => void;
}> = ({ className, checked, onChange, label, bottomLabel, id, name }) => {
  return (
    // The native radio button will be hiddel so we render a custom styled square
    <div className={cn("form-control", className)}>
      <label className="label cursor-pointer justify-normal">
        {/* The native radio button */}
        <input type="radio" name={name} id={id} checked={checked} onChange={onChange} className="radio hidden" />
        {/* The custom styled square */}

        <div
          className={cn(
            "w-6 h-6 border border-primary border-2 aspect-square flex justify-center items-center",
            className
          )}
        >
          {/* Render a filled square inside if it's checked */}
          {checked ? <span className="block w-[18px] h-[18px] bg-accent"></span> : null}
        </div>
        {label ? <span className="label-text text-xs ml-2">{label}</span> : null}
      </label>
      {bottomLabel ? <span className="label-text ml-1 text-xs opacity-75">{bottomLabel}</span> : null}
    </div>
  );
};

export const RadioGroup: React.FC<{
  name: string;
  value: string;
  options: { id: string; label: string; bottomLabel?: string }[];
  className?: string;
  onChange: (value: string) => void;
}> = ({ name, value, options, className, onChange }) => {
  return (
    <div className={cn("flex w-full gap-8", className)}>
      {options.map((option) => (
        <RadioButton
          key={option.id}
          id={option.id}
          name={name}
          label={option.label}
          bottomLabel={option.bottomLabel}
          checked={value === option.id}
          onChange={() => onChange(option.id)}
        />
      ))}
    </div>
  );
};
