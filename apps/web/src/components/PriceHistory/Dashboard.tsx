import { useState } from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { Tabs } from "@/components/core/Tabs";
import { BoostEmpire } from "@/components/PriceHistory/BoostEmpire";
import { EmpireDetails } from "@/components/PriceHistory/EmpireDetails";
import { HistoricalPointGraph } from "@/components/PriceHistory/HistoricalPointGraph";
import { KPICard } from "@/components/PriceHistory/KPICard";
import { SellPoints } from "@/components/PriceHistory/SellPoints";
import { useEmpires } from "@/hooks/useEmpires";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { cn } from "@/util/client";
import { EmpireEnumToConfig } from "@/util/lookups";

export const Dashboard = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(EEmpire.LENGTH);
  const [selectedTab, setSelectedTab] = useState<"boost" | "sell">("sell");
  const empires = useEmpires();

  return (
    <Modal title="Dashboard">
      <Modal.Button size="md" variant="neutral" className="z-50 w-56">
        <IconLabel imageUri={InterfaceIcons.Trade} text="DASHBOARD" className="" />
      </Modal.Button>
      <Modal.Content>
        <div className="grid grid-cols-8 gap-1">
          <div className="col-span-6 flex flex-col gap-1">
            <SecondaryCard className="flex flex-col gap-1">
              <Join className="m-1 flex">
                <Button selected={selectedTab === "boost"} onClick={() => setSelectedTab("boost")} className="btn-sm">
                  Boost Empire
                </Button>
                <Button selected={selectedTab === "sell"} onClick={() => setSelectedTab("sell")} className="btn-sm">
                  Sell Points
                </Button>
              </Join>
              {selectedTab === "boost" && <BoostEmpire />}
              {selectedTab === "sell" && <SellPoints />}
            </SecondaryCard>

            <SecondaryCard>
              <RadioGroup
                name="select-empire-chart"
                className="hidden justify-end lg:flex"
                value={selectedEmpire.toString()}
                options={[
                  ...Array.from(empires.keys())
                    .map((_, i) => i + 1)
                    .map((empire) => ({
                      id: empire.toString(),
                      label: EmpireEnumToConfig[empire as EEmpire].name,
                    })),
                  {
                    id: EEmpire.LENGTH.toString(),
                    label: "All",
                  },
                ]}
                onChange={(value) => setSelectedEmpire(Number(value) as EEmpire)}
              />

              <div className="h-40 w-full lg:h-96">
                <ParentSize>
                  {({ width: visWidth, height: visHeight }) => (
                    <HistoricalPointGraph
                      empire={selectedEmpire}
                      width={visWidth}
                      height={visHeight}
                      margin={{ top: 20, right: 20, bottom: 30, left: 55 }}
                    />
                  )}
                </ParentSize>
              </div>
            </SecondaryCard>
            <KPICards />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Sidebar />
          </div>
        </div>
      </Modal.Content>
    </Modal>
  );
};

const Sidebar: React.FC = () => {
  const windowWidth = useWindowDimensions().width;
  const isMobile = windowWidth < 1024;
  if (isMobile) {
    return (
      <Tabs persistIndexKey="dashboard" defaultIndex={0}>
        <div className="mb-1 flex flex-col gap-[1px]">
          <Tabs.Button index={0} className="text-xs">
            Market Rates
          </Tabs.Button>
          <Tabs.Button index={1}>Portfolio</Tabs.Button>
          <Tabs.Button index={2}>Earnings</Tabs.Button>
        </div>
        <Tabs.Pane index={0}>
          <EmpireDetails hideGraph hideTitle hidePlanets />
        </Tabs.Pane>
        <Tabs.Pane index={1}>
          <Account hideAccountBalance />
        </Tabs.Pane>
        <Tabs.Pane index={2}>
          <KPICards column size="sm" />
        </Tabs.Pane>
      </Tabs>
    );
  }

  return (
    <>
      <SecondaryCard>
        <p className="mb-2 text-xs">MARKET RATES</p>
        <EmpireDetails hideGraph hideTitle />
      </SecondaryCard>
      <SecondaryCard className="h-full">
        <p className="mb-2 text-xs">YOUR PORTFOLIO</p>
        <Account hideAccountBalance />
      </SecondaryCard>
    </>
  );
};

const KPICards: React.FC<{ column?: boolean; size?: "sm" | "lg" }> = ({ column = false, size = "lg" }) => {
  const { playerAccount } = useAccountClient();
  const { tables } = useCore();

  // Calculate KPIs
  const totalInvestment = tables.Value_PlayersMap.use(playerAccount.entity)?.loss ?? 0n;
  const totalEarned = tables.Value_PlayersMap.use(playerAccount.entity)?.gain ?? 0n;
  const netTotal = totalEarned - totalInvestment;

  return (
    <SecondaryCard className={cn("hidden justify-between gap-1 p-2 lg:grid lg:grid-cols-3", column && "flex flex-col")}>
      <KPICard title="SPENT TO DATE" value={totalInvestment} size={size} />
      <KPICard title="EARNED TO DATE" value={totalEarned} size={size} />
      <KPICard title="NET" value={netTotal} size={size} />
    </SecondaryCard>
  );
};
