import { useMemo } from "react";
import { toHex } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { CHART_TICK_INTERVALS, EViewMode } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { allEmpires, EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { EmpireCards } from "@/components/dashboard/EmpireCards";
import { HistoricalPointGraph } from "@/components/dashboard/HistoricalPointGraph";
import { BoostEmpire } from "@/components/quick-trade/BoostEmpire";
import { SellPoints } from "@/components/quick-trade/SellPoints";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

export const Dashboard = () => {
  const { ChartConfig, ViewMode, SelectedTab } = useSettings();
  const viewMode = ViewMode.use()?.value ?? EViewMode.Map;
  const showMap = viewMode === EViewMode.Map;

  const {
    MAIN: { sprite },
  } = useGame();
  const { tables } = useCore();
  const persistKey = toHex("trading-chart") as Entity;
  const selectedTab = SelectedTab.use(persistKey)?.value ?? 0;
  const selectedEmpire = selectedTab === 0 ? EEmpire.LENGTH : (selectedTab as EEmpire);
  const chartConfig = ChartConfig.use();
  const empireCount = tables.P_GameConfig.use()?.empireCount ?? 0;

  const DashboardContent = useMemo(() => {
    if (showMap) return null;
    return (
      <div
        className={cn(
          "flex h-[75vh] w-[calc(100vw-32px)] max-w-[1200px] justify-center transition-opacity duration-300",
          showMap ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="ml-6 grid grid-cols-3 gap-2 lg:ml-0 lg:w-full lg:grid-cols-1">
          <div className="relative col-span-2 h-full min-h-40 lg:pr-2">
            <SecondaryCard noDecor className="h-full">
              <div className="grid grid-cols-[1fr_auto]">
                <Tabs persistIndexKey="trading-chart" defaultIndex={0}>
                  <Join direction="horizontal" className="rounded-r !pr-0 hover:bg-transparent">
                    <Tabs.Button key="all" index={0} className="h-8 w-11">
                      <div>
                        <h1>ALL</h1>
                      </div>
                    </Tabs.Button>
                    {allEmpires.slice(0, empireCount).map((empire) => {
                      const spriteUrl = sprite.getSprite(EmpireToPlanetSpriteKeys[empire] ?? "PlanetGrey");
                      return (
                        <Tabs.Button key={empire} index={empire} className="-mb-[1px] h-8">
                          <img src={spriteUrl} className="w-4" />
                        </Tabs.Button>
                      );
                    })}
                  </Join>
                </Tabs>
                {selectedEmpire !== EEmpire.LENGTH && (
                  <Join direction="horizontal" className="rounded-r hover:bg-transparent">
                    {CHART_TICK_INTERVALS.map((interval) => (
                      <Button
                        key={interval.value}
                        size="xs"
                        variant="neutral"
                        selected={chartConfig?.tickInterval === interval.value}
                        onClick={() => ChartConfig.update({ tickInterval: interval.value })}
                      >
                        {interval.label}
                      </Button>
                    ))}
                  </Join>
                )}
              </div>
              <HistoricalPointGraph empire={selectedEmpire} tickInterval={chartConfig?.tickInterval ?? 60} />
            </SecondaryCard>
          </div>
          <EmpireCards />
        </div>
        <Sidebar />
      </div>
    );
  }, [showMap, chartConfig, selectedEmpire, empireCount]);

  return DashboardContent;
};

const Sidebar = () => {
  return (
    <SecondaryCard className="hidden lg:flex">
      <QuickTradeSidebar className="mt-2" />
    </SecondaryCard>
  );
};

export const QuickTradeSidebar = ({ className }: { className?: string }) => {
  return (
    <Tabs
      persistIndexKey="quick-trade-sidebar"
      defaultIndex={0}
      className={cn("-mt-1 flex-col items-center justify-center lg:left-1/2 lg:flex", className)}
    >
      <Join className="flex -rotate-90 justify-center lg:-mt-[5px] lg:rotate-0">
        <Tabs.Button size="sm" index={0} togglable variant="primary" className="mr-1">
          Boost
        </Tabs.Button>
        <Tabs.Button size="sm" index={1} togglable variant="primary">
          Sell
        </Tabs.Button>
      </Join>
      <Tabs.Pane index={0} fragment>
        <BoostEmpire />
      </Tabs.Pane>
      <Tabs.Pane index={1} fragment>
        <SellPoints />
      </Tabs.Pane>
    </Tabs>
  );
};
