import React, { useState } from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import { adjustDecimals } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Popout } from "@/components/core/Popout";
import { cn } from "@/util/client";

export const SlippageSettings = ({ className, disabled }: { className?: string; disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popout
      direction="top"
      visible={isOpen}
      setVisible={setIsOpen}
      popoutContent={<_SlippageSettings />}
      containerClassName={className}
    >
      <Button variant="ghost" size="xs" shape="square" onClick={() => setIsOpen(true)} disabled={disabled}>
        <Cog6ToothIcon className="size-4 transition-all duration-300 hover:rotate-45" />
      </Button>
    </Popout>
  );
};
export const _SlippageSettings = () => {
  const { tables } = useCore();
  const { isAuto, autoValue, customValue } = tables.Slippage.use() ?? { isAuto: true, autoValue: 5, customValue: 0 };
  const slippage = isAuto ? autoValue : customValue;
  return (
    <SecondaryCard className="pointer-events-auto bg-neutral">
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="mr-2 text-xs">MAX SLIPPAGE</span>
        </div>
        <span className="text-[0.6rem] opacity-50">Add tolerance for price changes</span>
        <div className="flex items-center gap-2">
          <Join>
            <Button
              onClick={() => tables.Slippage.update({ isAuto: true })}
              variant={isAuto ? "secondary" : "neutral"}
              size="xs"
            >
              AUTO
            </Button>
            <Button
              onClick={() => tables.Slippage.update({ isAuto: false })}
              variant={isAuto ? "neutral" : "secondary"}
            >
              CUSTOM
            </Button>
          </Join>
          <div className="relative">
            <input
              type="number"
              className={cn(
                "w-16 rounded-md border border-secondary bg-neutral px-2 py-1 text-xs focus:outline-none disabled:opacity-50",
              )}
              disabled={isAuto}
              value={`${slippage}`}
              placeholder={`${slippage}`}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                let value = adjustDecimals(e.target.value, 1);
                if (Number(value) >= 1 && value.startsWith("0")) {
                  value = value.replace(/^0+/, "");
                }
                if (Number(value) > 999) return;
                if (Number(value) === 0) return tables.Slippage.update({ customValue: 0 });
                tables.Slippage.update({ customValue: Number(value) });
              }}
            />
            <p className={cn("absolute right-1 top-1/2 -translate-y-1/2", isAuto ? "opacity-50" : "")}>%</p>
          </div>
        </div>
      </div>
    </SecondaryCard>
  );
};
