import { useCore } from "@primodiumxyz/core/react";
import { Toggle } from "@/components/core/Toggle";
import { cn } from "@/util/client";

export const ModeToggle = ({ className }: { className?: string }) => {
  const { tables } = useCore();
  const advancedMode = tables.AdvancedMode.use()?.value ?? false;

  return (
    <Toggle
      label="Show map"
      defaultChecked={advancedMode}
      onToggle={() => tables.AdvancedMode.set({ value: !advancedMode })}
      className={cn(className)}
    />
  );
};
