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
import { Keys } from "@primodiumxyz/core";
import { useCore, useSyncStatus } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { EmpireLogo } from "@/components/shared/EmpireLogo";
import { useActions, useMostRecentOverride } from "@/hooks/useActions";
import { useEmpires } from "@/hooks/useEmpires";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const ActionLog = ({ className }: { className: string }) => {
  const { SelectedTab } = useSettings();
  const { loading } = useSyncStatus(Keys.ACTION_LOG);

  const [open, setOpen] = useState(false);
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

  return (
    <SecondaryCard
      className={cn(
        "relative hidden h-[310px] w-80 flex-grow gap-2 overflow-y-auto rounded-box transition-all lg:block 2xl:w-96",
        open ? "bg-black/75 pr-0" : "translate-y-2/3",
        loading && "translate-y-[150%]",
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
  const { tables } = useCore();
  const override = useMostRecentOverride();
  const gameStartTimestamp = tables.P_GameConfig.use()?.gameStartTimestamp ?? 0n;
  const action =
    override && (override.timestamp ?? gameStartTimestamp) >= gameStartTimestamp ? (
      override.element
    ) : (
      <p className="text-xs opacity-70">No player actions</p>
    );

  const [currentAction, setCurrentAction] = useState("");
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!override) return;
    setCurrentAction(override.id);
    if (currentAction === "") return;
    if (currentAction === override.id) return;
    setFlashing(true);
    setTimeout(() => setFlashing(false), 500);
  }, [override, currentAction]);

  const colorClass = override ? EmpireEnumToConfig[override.empireId as EEmpire].bgColor : "bg-gray-600";
  return (
    <SecondaryCard
      className={cn(
        flashing
          ? `scale-105 ${colorClass} transition-transform duration-500`
          : override?.highlight
            ? "border border-accent/75 hover:border-accent/100"
            : "",
      )}
    >
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

  return (
    <Tabs className="grid grid-cols-[auto_1fr] gap-y-1" persistIndexKey={"action-log"} defaultIndex={0}>
      <Join direction="vertical" className="h-full rounded-r !pr-0 hover:bg-transparent">
        <Tabs.Button key={"all"} index={0} className="-mb-[1px] h-8 w-11">
          <h1>ALL</h1>
        </Tabs.Button>
        {Array.from(empires.entries()).map(([id, emp], i) => (
          <Tabs.Button key={id} index={i + 1} className="-mb-[2px] h-9">
            <EmpireLogo empireId={id} size="xs" />
          </Tabs.Button>
        ))}
      </Join>
      <ScrollToBottom className="mt-1 h-[212px] w-full pr-2">
        {actions.map((action, i) => (
          <div
            className={cn(
              "px-2",
              i % 2 === 0 ? "bg-secondary/30" : "bg-black/30",
              action.highlight && "border border-accent/75",
            )}
            key={`${Number(action.timestamp)}-${i}`}
          >
            {action.element}
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
      <div className="col-span-2">
        <Button
          className="flex items-center gap-2 text-xs text-gray-400"
          variant="ghost"
          onClick={() => ShowRoutineLogs.set({ value: !showRoutineLogs })}
        >
          {showRoutineLogs ? (
            <>
              <EyeSlashIcon className="size-4" />
              <span className="text-xs">Hide routines</span>
            </>
          ) : (
            <>
              <EyeIcon className="size-4 opacity-70" />
              <span className="text-xs opacity-70">Show routines</span>
            </>
          )}
        </Button>
      </div>
    </Tabs>
  );
};
