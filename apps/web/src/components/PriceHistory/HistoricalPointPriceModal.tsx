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
import { useBalance } from "@/hooks/useBalance";
import { usePointPrice } from "@/hooks/usePointPrice";
import { usePoints } from "@/hooks/usePoints";
import { usePot } from "@/hooks/usePot";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

export const EmpireEnumToFillColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "stroke-blue-400",
  [EEmpire.Green]: "stroke-green-400",
  [EEmpire.Red]: "stroke-red-400",
  [EEmpire.LENGTH]: "",
};

export const EmpireEnumToTextColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "text-blue-400",
  [EEmpire.Green]: "text-green-400",
  [EEmpire.Red]: "text-red-400",
  [EEmpire.LENGTH]: "",
};

interface HistoricalPointPriceModalProps {}

export const HistoricalPointPriceModal = ({}: HistoricalPointPriceModalProps) => {
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(EEmpire.LENGTH);
  const { playerAccount } = useAccountClient();
  const { tables } = useCore();
  const { pot } = usePot();
  const points = usePoints(playerAccount.entity);
  const { price: redPointCost } = usePointPrice(EEmpire.Red, Number(formatEther(points[EEmpire.Red].playerPoints)));
  const { price: bluePointCost } = usePointPrice(EEmpire.Blue, Number(formatEther(points[EEmpire.Blue].playerPoints)));
  const { price: greenPointCost } = usePointPrice(
    EEmpire.Green,
    Number(formatEther(points[EEmpire.Green].playerPoints)),
  );
  const earnings = useMemo(() => {
    const biggestReward = Object.entries(points).reduce<{ empire: EEmpire; points: bigint }>(
      (acc, [empire, { playerPoints }]) => {
        if (playerPoints > acc.points) {
          return { empire: Number(empire) as EEmpire, points: playerPoints };
        }
        return acc;
      },
      { empire: EEmpire.Red, points: 0n },
    );

    const playerPoints = points[biggestReward.empire].playerPoints;
    const empirePoints = points[biggestReward.empire].empirePoints;

    return !!empirePoints ? (pot * playerPoints) / empirePoints : 0n;
  }, [points, pot]);

  const earningsImmediate = useMemo(() => {
    return redPointCost + bluePointCost + greenPointCost;
  }, [redPointCost, bluePointCost, greenPointCost]);

  // Calculate KPIs
  const walletBalance = useBalance(playerAccount.address).value ?? 0n;
  const totalInvestment = tables.Player.get(playerAccount.entity)?.spent ?? 0n;
  const netTotalPotential = earnings - totalInvestment;
  const netTotalImmediate = earningsImmediate - totalInvestment;

  return (
    <Modal title="Marketplace">
      <Modal.Button size="sm" variant="neutral" className="rounded-t-none !border-t-0">
        <IconLabel imageUri={InterfaceIcons.Trade} text="OPEN MARKET" className="mx-2 text-xs" />
      </Modal.Button>
      <Modal.Content>
        <div className="grid grid-cols-8 gap-4">
          <div className="col-span-6 flex flex-col gap-2">
            <SecondaryCard className="flex-row flex-wrap justify-between gap-2 p-2">
              <KPICard title="MY WALLET" value={walletBalance} />
              <KPICard title="TOTAL SPENT" value={totalInvestment} />
              <KPICard title="NET TOTAL (IMMEDIATE)" value={netTotalImmediate} />
              <KPICard title="NET TOTAL (POTENTIAL)" value={netTotalPotential} />
            </SecondaryCard>
            <SecondaryCard>
              <RadioGroup
                name="select-empire-chart"
                className="justify-end"
                value={selectedEmpire.toString()}
                options={[
                  ...Array.from(new Array(EEmpire.LENGTH))
                    .map((_, i) => i + 1)
                    .map((empire) => ({
                      id: empire.toString(),
                      label: empire === EEmpire.LENGTH ? "ALL EMPIRES" : EmpireEnumToName[empire as EEmpire],
                    })),
                ]}
                onChange={(value) => setSelectedEmpire(Number(value) as EEmpire)}
              />

              <div className="h-80 w-full">
                <ParentSize>
                  {({ width: visWidth, height: visHeight }) => (
                    <p>
                      <HistoricalPointGraph empire={selectedEmpire} width={visWidth} height={visHeight} />
                    </p>
                  )}
                </ParentSize>
              </div>
            </SecondaryCard>

            <SellPoints />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <SecondaryCard>
              <p className="mb-2 text-sm">YOUR PORTFOLIO</p>
              <Account hideAccountBalance />
            </SecondaryCard>
            <SecondaryCard>
              <p className="mb-2 text-sm">MARKET RATES</p>
              <EmpireDetails hideGraph />
            </SecondaryCard>
            <SecondaryCard className="grow">
              <p className="mb-2 text-sm">TX HISTORY</p>
              <p className="mt-5 text-center opacity-25">COMING SOON</p>
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
