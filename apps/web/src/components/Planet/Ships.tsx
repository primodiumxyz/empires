import { ReactNode, useEffect, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { IconLabel } from "@/components/core/IconLabel";
import { Tooltip } from "@/components/core/Tooltip";

export const Ships = ({
  shipCount,
  planetId,
  planetEmpire,
}: {
  shipCount: bigint;
  planetId: Entity;
  planetEmpire: EEmpire;
}) => {
  const { tables } = useCore();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const listener = tables.CreateShipOverride.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.overrideCount };
      if (data.planetId !== planetId) return;

      // Add floating "+1" text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: `+${data.shipCount}` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  useEffect(() => {
    const listener = tables.KillShipOverride.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.overrideCount };
      if (data.planetId !== planetId) return;

      console.log(current);

      // Add floating "+1" text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: `-${data.shipCount}` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  useEffect(() => {
    const listener = tables.BuyShipsRoutine.update$.subscribe(({ properties: { current } }) => {
      if (!current) return;
      const data = { planetId: current.planetId, shipCount: current.shipBought, goldSpent: current.goldSpent };
      if (data.planetId !== planetId) return;

      // Add floating text
      setFloatingTexts((prev) => [...prev, { id: nextId, text: `+${data.shipCount}` }]);
      setNextId((prev) => prev + 1);

      // Remove the floating text after 3 seconds
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
      }, 5000);
    });
    return () => {
      listener.unsubscribe();
    };
  }, [nextId]);

  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIPS`}>
        <p className="flex items-center justify-center gap-2">
          <IconLabel imageUri={InterfaceIcons.Fleet} text={shipCount.toLocaleString()} />
        </p>
      </Tooltip>
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text pointer-events-none absolute left-1 top-0 z-50 w-fit -translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
