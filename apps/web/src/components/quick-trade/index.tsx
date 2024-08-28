import { useEffect } from "react";
import { toHex } from "viem";

import { EViewMode } from "@primodiumxyz/core";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Modal } from "@/components/core/Modal";
import { Tabs } from "@/components/core/Tabs";
import { BoostEmpire } from "@/components/quick-trade/BoostEmpire";
import { SellPoints } from "@/components/quick-trade/SellPoints";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/util/client";

export const QuickTradeModal = () => {
  return (
    <Join className="absolute -top-[4px] left-1.5 flex -translate-x-1/2 -rotate-90 lg:flex lg:rotate-0">
      <Modal title="Boost">
        <Modal.Button size="sm" variant="primary" className="mr-1">
          Boost
        </Modal.Button>
        <Modal.Content>
          <BoostEmpire />
        </Modal.Content>
      </Modal>
      <Modal title="sell">
        <Modal.Button size="sm" variant="primary">
          Sell
        </Modal.Button>
        <Modal.Content>
          <SellPoints />
        </Modal.Content>
      </Modal>
    </Join>
  );
};

export const QuickTradeMapMode = ({ className }: { className?: string }) => {
  const { SelectedTab, ViewMode } = useSettings();
  const viewMode = ViewMode.use()?.value ?? EViewMode.Map;

  useEffect(() => {
    SelectedTab.set({ value: -1 }, toHex("quick-trade") as Entity);
  }, [viewMode]);

  return (
    <Tabs
      persistIndexKey="quick-trade"
      defaultIndex={-1}
      className={cn("-mt-1 flex-col items-center justify-center lg:left-1/2 lg:flex", className)}
      onPointerMissed={() => SelectedTab.set({ value: -1 }, toHex("quick-trade") as Entity)}
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
        <Card className="pointer-events-auto w-[430px]">
          <Tabs.CloseButton
            variant="ghost"
            shape="square"
            className="pointer-events-auto absolute right-4 top-4 z-[100] opacity-50"
          >
            X
          </Tabs.CloseButton>
          <BoostEmpire />
        </Card>
      </Tabs.Pane>
      <Tabs.Pane index={1} fragment>
        <Card className="pointer-events-auto w-[430px]">
          <Tabs.CloseButton
            variant="ghost"
            shape="square"
            className="pointer-events-auto absolute right-4 top-4 z-[100] opacity-50"
          >
            X
          </Tabs.CloseButton>

          <SellPoints />
        </Card>
      </Tabs.Pane>
    </Tabs>
  );
};
