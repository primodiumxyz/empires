import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { EEmpire } from "@primodiumxyz/contracts";
import { EViewMode } from "@primodiumxyz/core";
import { SecondaryCard } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { EmpireCards } from "@/components/Dashboard/EmpireCards";
import { HistoricalPointGraph } from "@/components/Dashboard/HistoricalPointGraph";
import { BoostEmpire } from "@/components/quick-trade/BoostEmpire";
import { SellPoints } from "@/components/quick-trade/SellPoints";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

export const Dashboard = () => {
  const { ViewMode } = useSettings();
  const viewMode = ViewMode.use()?.value ?? EViewMode.Map;
  const showMap = viewMode === EViewMode.Map;
  if (showMap) return null;
  return (
    <div
      className={cn(
        "flex h-[75vh] w-[calc(100vw-32px)] max-w-[1200px] justify-center transition-opacity duration-300",
        showMap ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="ml-6 grid grid-cols-3 gap-8 lg:ml-0 lg:!flex lg:w-full lg:flex-col">
        <div className="col-span-2 h-full min-h-40">
          <ParentSize>
            {({ width: visWidth, height: visHeight }) => (
              <HistoricalPointGraph
                empire={EEmpire.LENGTH}
                width={visWidth}
                height={visHeight}
                margin={{ top: 20, right: 20, bottom: 30, left: 55 }}
              />
            )}
          </ParentSize>
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
