import { ReactNode, useEffect, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { IconLabel } from "@/components/core/IconLabel";
import { Tooltip } from "@/components/core/Tooltip";

export const GoldCount = ({ goldCount, entity }: { goldCount: bigint; entity: Entity }) => {
  const { tables } = useCore();

  const [goldFloatingTexts, setGoldFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const listener = tables.BuyShipsRoutine.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.shipBought, goldSpent: current.goldSpent };
      if (data.planetId !== entity) return;

      // Add floating text
      setGoldFloatingTexts((prev) => [...prev, { id: nextId, text: `-${data.goldSpent}` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setGoldFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  return (
    <div className="pointer-events-auto relative z-50">
      <Tooltip tooltipContent={`GOLD`}>
        <p className="pointer-events-auto flex items-center justify-center gap-1.5">
          <IconLabel imageUri={InterfaceIcons.Vault} text={goldCount.toLocaleString()} />
        </p>
      </Tooltip>
      {goldFloatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
