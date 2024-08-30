import { useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/solid";
import ScrollToBottom, { useScrollToBottom, useSticky } from "react-scroll-to-bottom";
import { toHex } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { Tooltip } from "@/components/core/Tooltip";
import { useActions, useMostRecentOverride } from "@/hooks/useActions";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const ActionLog = ({ className }: { className: string }) => {
  const [open, setOpen] = useState(false);
  const { SelectedTab } = useSettings();
  const persistKey = toHex("action-log") as Entity;
  const selectedTab = SelectedTab.use(persistKey)?.value ?? 0;
  const scrollToBottom = useScrollToBottom();
  useEffect(() => {
    if (!open) {
      SelectedTab.set({ value: 0 }, persistKey);
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom({ behavior: "auto" });
  }, [selectedTab]);

  // return null;
  return (
    <SecondaryCard
      className={cn(
        "pointer--events-auto relative hidden h-[300px] flex-grow gap-2 overflow-y-auto rounded-box transition-all lg:block 2xl:w-96",
        open ? "" : "translate-y-2/3",
        className,
      )}
    >
      <Button className="absolute right-1 top-1" onClick={() => setOpen(!open)} shape="square" variant="ghost">
        {open ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
      </Button>

      <div className="flex items-center justify-between">
        <p className="text-xs opacity-70">Recent Actions</p>
      </div>
      {open ? <OpenActionLog /> : <ClosedActionLog />}
    </SecondaryCard>
  );
};

const ClosedActionLog = () => {
  const override = useMostRecentOverride();
  const action = override ? override.element : <p className="text-xs opacity-70">No player actions</p>;

  const [currentAction, setCurrentAction] = useState(0n);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!override) return;
    setCurrentAction(override.timestamp);
    if (currentAction === 0n) return;
    if (currentAction === override.timestamp) return;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 500);
  }, [override, currentAction]);

  const colorClass = override ? EmpireEnumToConfig[override.empireId as EEmpire].bgColor : "bg-gray-600";
  return (
    <SecondaryCard className={cn(flashing ? `scale-105 ${colorClass} transition-transform duration-500` : "")}>
      {action}
    </SecondaryCard>
  );
};

const OpenActionLog = () => {
  const empires = useEmpires();
  const { SelectedTab, ShowRoutineLogs } = useSettings();
  const showRoutineLogs = ShowRoutineLogs.use()?.value ?? false;
  const persistKey = toHex("action-log") as Entity;
  const selectedTab = SelectedTab.use(persistKey)?.value ?? 0;
  const selectedEmpire = selectedTab === 0 ? undefined : (selectedTab as EEmpire);
  const actions = useActions(selectedEmpire, { max: 300, filterRoutines: !showRoutineLogs });
  const scrollToBottom = useScrollToBottom();
  const [sticky] = useSticky();
  const {
    ROOT: { sprite },
  } = useGame();
  return (
    <Tabs className="flex gap-1" persistIndexKey={"action-log"} defaultIndex={0}>
      <Join direction="vertical" className="h-full rounded-r">
        <Tabs.Button key={"all"} index={0} className="h-8 w-11">
          <div>
            <h1>ALL</h1>
          </div>
        </Tabs.Button>
        {Array.from(empires.entries()).map(([id, emp], i) => {
          const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[id] ?? "PlanetGrey");
          return (
            <Tabs.Button key={emp.name} index={i + 1} className="-mb-[1px] h-8">
              <img src={spriteUrl} className="w-4" />
            </Tabs.Button>
          );
        })}
      </Join>
      <ScrollToBottom className="h-[230px] w-full">
        {actions.map((action, i) => (
          <div className="flex flex-col" key={`${Number(action.timestamp)}-${i}`}>
            {action.element}
            <hr className="w-full border-secondary/50" />
          </div>
        ))}
      </ScrollToBottom>
      {!sticky && (
        <Button
          className="absolute bottom-0 right-0"
          size="xs"
          variant="secondary"
          shape="square"
          onClick={() => scrollToBottom()}
        >
          <ArrowDownIcon className="h-4 w-4" />
        </Button>
      )}
      <Button
        className="absolute bottom-2 left-5"
        variant="ghost"
        shape="square"
        onClick={() => ShowRoutineLogs.update({ value: !showRoutineLogs })}
      >
        {showRoutineLogs ? (
          <Tooltip tooltipContent="Click to hide routine logs" direction="right">
            <EyeIcon className="size-4" />
          </Tooltip>
        ) : (
          <Tooltip tooltipContent="Click to show routine logs" direction="right">
            <EyeSlashIcon className="size-4 opacity-50" />
          </Tooltip>
        )}
      </Button>
    </Tabs>
  );
};
