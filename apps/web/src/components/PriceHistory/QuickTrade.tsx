import { useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { Button } from "@/components/core/Button";
import { IconLabel } from "@/components/core/IconLabel";
import { Modal } from "@/components/core/Modal";
import { Tabs } from "@/components/core/Tabs";
import { BoostEmpire } from "@/components/PriceHistory/BoostEmpire";
import { SellPoints } from "@/components/PriceHistory/SellPoints";
import { useEmpires } from "@/hooks/useEmpires";
import { useGame } from "@/hooks/useGame";
import { DEFAULT_EMPIRE } from "@/util/lookups";

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
        <Tabs defaultIndex={1}>
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
              <span className="mb-4 block text-center text-xs text-gray-400">
                Get points for supporting an empire by airdropping gold to its planets
              </span>
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
              <BoostEmpire selectedEmpire={selectedEmpire} />
            </Tabs.Pane>
            <Tabs.Pane index={1}>
              <span className="mb-4 block text-center text-xs text-gray-400">Directly sell points from an empire</span>
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
              <SellPoints selectedEmpire={selectedEmpire} fragment />
            </Tabs.Pane>
          </div>
        </Tabs>
      </Modal.Content>
    </Modal>
  );
};
