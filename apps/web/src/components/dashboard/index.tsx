import { toHex } from "viem";

import { EEmpire } from "@primodiumxyz/contracts";
import { EViewMode } from "@primodiumxyz/core";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { Entity } from "@primodiumxyz/reactive-tables";
import { SecondaryCard } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { EmpireCards } from "@/components/dashboard/EmpireCards";
import { HistoricalPointGraph } from "@/components/dashboard/HistoricalPointGraph";
import { BoostEmpire } from "@/components/quick-trade/BoostEmpire";
import { SellPoints } from "@/components/quick-trade/SellPoints";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

export const Dashboard = () => {
  const { ViewMode, SelectedTab } = useSettings();
  const viewMode = ViewMode.use()?.value ?? EViewMode.Map;
  const showMap = viewMode === EViewMode.Map;

  const {
    MAIN: { sprite },
  } = useGame();
  const persistKey = toHex("trading-chart") as Entity;
  const selectedTab = SelectedTab.use(persistKey)?.value ?? 0;
  const selectedEmpire = selectedTab === 0 ? EEmpire.LENGTH : (selectedTab as EEmpire);
  const empires = useEmpires();

  if (showMap) return null;
  return (
    <div
      className={cn(
        "flex h-[75vh] w-[calc(100vw-32px)] max-w-[1200px] justify-center transition-opacity duration-300",
        showMap ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="ml-6 grid grid-cols-3 gap-2 lg:ml-0 lg:!flex lg:w-full lg:flex-col">
        <div className="relative col-span-2 h-full min-h-40 pr-2">
          <SecondaryCard noDecor className="h-full">
            <Tabs persistIndexKey="trading-chart" defaultIndex={0}>
              <Join direction="horizontal" className="rounded-r !pr-0 hover:bg-transparent">
                <Tabs.Button key="all" index={0} className="h-8 w-11">
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
            </Tabs>
            <HistoricalPointGraph empire={selectedEmpire} />
          </SecondaryCard>
        </div>
        <EmpireCards />
      </div>
      <Sidebar />
    </div>
  );
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
