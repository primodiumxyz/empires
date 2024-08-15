import { useState } from "react";
import ParentSize from "@visx/responsive/lib/components/ParentSize";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { useAccountClient, useCore } from "@primodiumxyz/core/react";
import { Account } from "@/components/Account";
import { Button } from "@/components/core/Button";
import { SecondaryCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Modal } from "@/components/core/Modal";
import { RadioGroup } from "@/components/core/Radio";
import { Tabs } from "@/components/core/Tabs";
import { EmpireDetails } from "@/components/PriceHistory/EmpireDetails";
import { HistoricalPointGraph } from "@/components/PriceHistory/HistoricalPointGraph";
import { KPICard } from "@/components/PriceHistory/KPICard";
import { SellPoints } from "@/components/PriceHistory/SellPoints";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { cn } from "@/util/client";
import { DEFAULT_EMPIRE, EmpireEnumToConfig } from "@/util/lookups";

export const QuickTrade = () => {
  const empires = useEmpires();
  const {
    MAIN: { sprite },
  } = useGame();
  const [selectedEmpire, setSelectedEmpire] = useState<EEmpire>(DEFAULT_EMPIRE);

  return (
    <Modal title="Quick Trade">
      <Modal.Button size="md" variant="neutral" className="-translate-x-[60px] -rotate-90 lg:translate-x-0 lg:rotate-0">
        <IconLabel imageUri={InterfaceIcons.Resource} text="QUICK TRADE" className="" />
      </Modal.Button>
      <Modal.Content>
        <Tabs defaultIndex={0}>
          <div className="absolute -top-6 left-1/2 mb-2 flex -translate-x-1/2 justify-center">
            <Tabs.Button size="md" index={0}>
              Boost
            </Tabs.Button>
            <Tabs.Button size="md" index={1}>
              Sell
            </Tabs.Button>
          </div>
          <div className="mt-6">
            <Tabs.Pane index={0}>
              <EmpireDetails hideGraph hideTitle hidePlanets />
            </Tabs.Pane>
            <Tabs.Pane index={1} fragment>
              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {Array.from(empires.entries()).map(([key, empire]) => (
                  <Button
                    key={key}
                    variant={selectedEmpire === key ? "secondary" : "neutral"}
                    onClick={() => setSelectedEmpire(key)}
                  >
                    <IconLabel imageUri={sprite.getSprite(empire.sprites.planet)} text={empire.name} />
                  </Button>
                ))}
              </div>
              <SellPoints selectedEmpire={selectedEmpire} />
            </Tabs.Pane>
          </div>
        </Tabs>
      </Modal.Content>
    </Modal>
  );
};
