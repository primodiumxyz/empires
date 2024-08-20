import { useState } from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { BoostEmpireDashboard } from "@/components/Dashboard/BoostEmpireDashboard";
import { EmpireDetails } from "@/components/Dashboard/EmpireDetails";
import { HistoricalPointGraph } from "@/components/Dashboard/HistoricalPointGraph";
import { KPICard } from "@/components/Dashboard/KPICard";
import { SellPointsDashboard } from "@/components/Dashboard/SellPointsDashboard";
import { Portfolio } from "@/components/Portfolio";
import { useEmpires } from "@/hooks/useEmpires";
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
      <Modal.Content className="w-full">
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
              {selectedTab === "boost" && <BoostEmpireDashboard />}
              {selectedTab === "sell" && <SellPointsDashboard />}
            </SecondaryCard>

            <SecondaryCard>
              <RadioGroup
                name="select-empire-chart"
                className="flex hidden justify-end"
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

              <div className="h-40 h-96 w-full">
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
  return (
    <>
      <SecondaryCard>
        <p className="mb-2 text-xs">MARKET RATES</p>
        <EmpireDetails hideGraph hideTitle />
      </SecondaryCard>
      <SecondaryCard className="h-full">
        <p className="mb-2 text-xs">YOUR PORTFOLIO</p>
        <Portfolio />
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
    <SecondaryCard className={cn("grid hidden grid-cols-3 justify-between gap-1 p-2", column && "flex flex-col")}>
      <KPICard title="SPENT TO DATE" value={totalInvestment} size={size} />
      <KPICard title="EARNED TO DATE" value={totalEarned} size={size} />
      <KPICard title="NET" value={netTotal} size={size} />
    </SecondaryCard>
  );
};
