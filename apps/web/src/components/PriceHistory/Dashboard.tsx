import { useMemo, useState } from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { formatEther } from "viem";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { SecondaryCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { EmpireDetails } from "@/components/PriceHistory/EmpireDetails";
import { HistoricalPointGraph } from "@/components/PriceHistory/HistoricalPointGraph";
import { SellPoints } from "@/components/PriceHistory/SellPoints";
import { Price } from "@/components/shared/Price";
import { useEmpires } from "@/hooks/useEmpires";
import { usePoints } from "@/hooks/usePoints";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE, EmpireEnumToConfig } from "@/util/lookups";

export const Dashboard = () => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(EEmpire.LENGTH);
  const { playerAccount } = useAccountClient();
  const {
    tables,
    utils: { getPointPrice },
  } = useCore();
  const { pot } = usePot();
  const points = usePoints(playerAccount.entity);
  const empires = useEmpires();
  const time = tables.Time.use()?.value;
  const pointCosts = useMemo(
    () =>
      Array.from(empires.entries()).map(([empire]) =>
        getPointPrice(empire, Number(formatEther(points[empire].playerPoints))),
      ),
    [empires, points, time],
  );

  const earnings = useMemo(() => {
    const biggestReward = Object.entries(points).reduce<{ empire: EEmpire; points: bigint }>(
      (acc, [empire, { playerPoints }]) => {
        if (playerPoints > acc.points) {
          return { empire: Number(empire) as EEmpire, points: playerPoints };
        }
        return acc;
      },
      { empire: DEFAULT_EMPIRE, points: 0n },
    );

    const playerPoints = points[biggestReward.empire].playerPoints;
    const empirePoints = points[biggestReward.empire].empirePoints;

    return !!empirePoints ? (pot * playerPoints) / empirePoints : 0n;
  }, [points, pot]);

  // Calculate KPIs
  const totalInvestment = tables.Value_PlayersMap.use(playerAccount.entity)?.loss ?? 0n;
  const totalEarned = tables.Value_PlayersMap.use(playerAccount.entity)?.gain ?? 0n;
  const netTotalPotential = earnings - totalInvestment;

  return (
    <Modal title="Dashboard">
      <Modal.Button size="md" variant="neutral">
        <IconLabel imageUri={InterfaceIcons.Trade} text="VIEW DASHBOARD" className="" />
      </Modal.Button>
      <Modal.Content>
        <div className="grid grid-cols-8 gap-1">
          <div className="col-span-6 flex flex-col gap-1">
            <SecondaryCard className="flex flex-col gap-2">
              <p className="text-xs">SELL POINTS</p>
              <SellPoints />
            </SecondaryCard>

            <SecondaryCard>
              <RadioGroup
                name="select-empire-chart"
                className="hidden justify-end lg:flex"
                value={selectedEmpire.toString()}
                options={Array.from(empires.keys())
                  .map((_, i) => i + 1)
                  .map((empire) => ({
                    id: empire.toString(),
                    label: EmpireEnumToConfig[empire as EEmpire].name,
                  }))}
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
            <SecondaryCard className="hidden justify-between gap-2 p-2 lg:grid lg:grid-cols-3">
              <KPICard title="SPENT TO DATE" value={totalInvestment} />
              <KPICard title="EARNED TO DATE" value={totalEarned} />
              <KPICard title="NET TOTAL (SELL NOW)" value={netTotalPotential} />
            </SecondaryCard>
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <SecondaryCard>
              <p className="mb-2 text-xs">MARKET RATES</p>
              <EmpireDetails hideGraph hideTitle />
            </SecondaryCard>
            <SecondaryCard className="hidden lg:flex">
              <p className="mb-2 text-xs">YOUR PORTFOLIO</p>
              <Account hideAccountBalance />
            </SecondaryCard>
          </div>
        </div>
      </Modal.Content>
    </Modal>
  );
};

interface KPICardProps {
  title: string;
  value: bigint;
  percentageChange?: bigint;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, percentageChange }) => {
  return (
    <div className="flex min-w-52 flex-col rounded-box bg-black/10 p-2">
      <h3 className="text-gray-4000 mb-1 text-xs">{title}</h3>

      <Price wei={value} className={cn("text-lg font-bold", value > 0 ? "text-success" : "text-error")} />
      <Price wei={value} forceBlockchainUnits className="text-sm opacity-50" />

      {percentageChange !== undefined && (
        <p className={cn("text-sm", percentageChange >= 0 ? "text-success" : "text-error")}>
          {(Number(percentageChange) / 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
};
