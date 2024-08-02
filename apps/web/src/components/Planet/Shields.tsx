import { useEffect, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { IconLabel } from "@/components/core/IconLabel";
import { Tooltip } from "@/components/core/Tooltip";

export const Shields = ({
  shieldCount,
  planetId,
  planetEmpire,
}: {
  shieldCount: bigint;
  planetId: Entity;
  planetEmpire: EEmpire;
}) => {
  const { tables } = useCore();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string }[]>([]);
  const [nextId, setNextId] = useState(0);
  const callback = (current: any, negative?: boolean) => {
    if (!current) return;
    const data = { planetId: current.planetId, shieldCount: current.overrideCount };
    if (data.planetId !== planetId) return;

    // Add floating text
    setFloatingTexts((prev) => [...prev, { id: nextId, text: `${negative ? "-" : "+"}${data.shieldCount}` }]);
    setNextId((prev) => prev + 1);

    // Remove the floating text after 3 seconds
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
    }, 5000);
  };
  useEffect(() => {
    const listener = tables.ChargeShieldsOverride.update$.subscribe(({ properties: { current } }) => callback(current));
    const listener2 = tables.DrainShieldsOverride.update$.subscribe(({ properties: { current } }) =>
      callback(current, true),
    );

    return () => {
      listener.unsubscribe();
      listener2.unsubscribe();
    };
  }, [nextId]);
  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIELDS`}>
        <p className="flex items-center justify-center">
          <IconLabel imageUri={InterfaceIcons.Defense} text={shieldCount.toLocaleString()} />
        </p>
      </Tooltip>

      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text pointer-events-none absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
