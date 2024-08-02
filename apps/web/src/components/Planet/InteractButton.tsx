import { forwardRef, useEffect, useRef, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { createLocalBoolTable, createWorld, Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { PlaceMagnetOverridePane } from "@/components/PlaceMagnetOverridePane";
import { ChargeOverridePane } from "@/components/Planet/ChargeOverridePane";
import { OverridePane } from "@/components/Planet/OverridePane";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useNextTurnOverrideCost, useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { cn } from "@/util/client";

const OverridePaneExpanded = createLocalBoolTable(createWorld(), {
  id: "OverridePaneExpanded",
  persist: true,
  version: "1",
});

export const InteractButton = forwardRef<
  HTMLButtonElement,
  {
    onClick: () => void;
    isInteractPaneVisible: boolean;
    planetId: Entity;
    planetEmpire: EEmpire;
    className: string;
  }
>(({ onClick, isInteractPaneVisible, planetId, planetEmpire, className }, ref) => {
  const InteractPaneRef = useRef<HTMLDivElement>(null);

  const { tables } = useCore();
  const { createShip, removeShip, addShield, removeShield, boostCharge, stunCharge } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const planet = tables.Planet.use(planetId);
  const expanded = OverridePaneExpanded.use()?.value ?? false;
  const [inputValue, setInputValue] = useState("1");

  const createShipPriceWei = useOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const killShipPriceWei = useOverrideCost(EOverride.KillShip, planetEmpire, BigInt(inputValue));
  const addShieldPriceWei = useOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const removeShieldPriceWei = useOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));
  const boostChargePriceWei = useOverrideCost(EOverride.BoostCharge, planetEmpire, BigInt(inputValue));
  const stunChargePriceWei = useOverrideCost(EOverride.StunCharge, planetEmpire, BigInt(inputValue));

  const nextCreateShipPriceWei = useNextTurnOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const nextKillShipPriceWei = useNextTurnOverrideCost(EOverride.KillShip, planetEmpire, BigInt(inputValue));
  const nextAddShieldPriceWei = useNextTurnOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const nextRemoveShieldPriceWei = useNextTurnOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));

  const handleInteractClick = () => {
    onClick();
  };

  // Close Interact Pane
  const handleClickOutside = (event: MouseEvent) => {
    if (
      InteractPaneRef.current &&
      !InteractPaneRef.current.contains(event.target as Node) &&
      ref &&
      !(ref as React.RefObject<HTMLButtonElement>).current?.contains(event.target as Node)
    ) {
      setInputValue("1");
      onClick();
    }
  };

  useEffect(() => {
    if (isInteractPaneVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInteractPaneVisible]);

  return (
    <div className={cn("relative")}>
      <Button ref={ref} className={cn(className)} size="sm" shape="default" onClick={handleInteractClick}>
        Interact
      </Button>
      {isInteractPaneVisible && (
        <div className="absolute left-1/2 top-12 -translate-x-1/2 backdrop-blur-2xl">
          <Card noDecor ref={InteractPaneRef} className="flex-row items-center justify-center gap-2 bg-slate-900/85">
            <div className="flex flex-col items-center justify-center gap-1">
              <Tabs className="flex w-[450px] flex-col items-center gap-2" defaultIndex={!planetEmpire ? 0 : 2}>
                <Join>
                  <Tabs.IconButton icon={InterfaceIcons.Fleet} text="SHIPS" index={0} disabled={!planetEmpire} />
                  <Tabs.IconButton icon={InterfaceIcons.Defense} text="SHIELD" index={1} disabled={!planetEmpire} />
                  <Tabs.IconButton icon={InterfaceIcons.Crosshairs} text="MAGNET" index={2} />
                  <Tabs.IconButton icon={InterfaceIcons.Shard} text="CHARGE" index={3} />
                </Join>
                <Tabs.Pane index={0} className="w-full items-center gap-4">
                  <OverridePane
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onAttackClick={() => {
                      removeShip(planetId, BigInt(inputValue), killShipPriceWei);
                      setInputValue("1");
                    }}
                    onSupportClick={() => {
                      createShip(planetId, BigInt(inputValue), createShipPriceWei);
                      setInputValue("1");
                    }}
                    attackPrice={killShipPriceWei}
                    supportPrice={createShipPriceWei}
                    nextAttackPrice={nextKillShipPriceWei}
                    nextSupportPrice={nextCreateShipPriceWei}
                    attackTxQueueId={`${planetId}-kill-ship`}
                    supportTxQueueId={`${planetId}-create-ship`}
                    isSupportDisabled={gameOver || Number(planetEmpire) === 0}
                    isAttackDisabled={
                      (planet?.shipCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planetEmpire) === 0
                    }
                    expanded={expanded}
                  />
                </Tabs.Pane>
                <Tabs.Pane index={1} className="w-full items-center gap-4">
                  <OverridePane
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onAttackClick={() => {
                      removeShield(planetId, BigInt(inputValue), removeShieldPriceWei);
                      setInputValue("1");
                    }}
                    onSupportClick={() => {
                      addShield(planetId, BigInt(inputValue), addShieldPriceWei);
                      setInputValue("1");
                    }}
                    attackPrice={removeShieldPriceWei}
                    supportPrice={addShieldPriceWei}
                    nextAttackPrice={nextRemoveShieldPriceWei}
                    nextSupportPrice={nextAddShieldPriceWei}
                    attackTxQueueId={`${planetId}-remove-shield`}
                    supportTxQueueId={`${planetId}-add-shield`}
                    isSupportDisabled={gameOver || Number(planetEmpire) === 0}
                    isAttackDisabled={
                      (planet?.shieldCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planetEmpire) === 0
                    }
                    expanded={expanded}
                  />
                </Tabs.Pane>
                <Tabs.Pane index={2} className="w-full items-center gap-4">
                  <PlaceMagnetOverridePane planetId={planetId} />
                </Tabs.Pane>
                <Tabs.Pane index={3} className="w-full items-center gap-4">
                  <ChargeOverridePane
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onBoostClick={() => {
                      boostCharge(planetId, BigInt(inputValue), boostChargePriceWei);
                      setInputValue("1");
                    }}
                    onStunClick={() => {
                      stunCharge(planetId, BigInt(inputValue), stunChargePriceWei);
                      setInputValue("1");
                    }}
                    boostPrice={boostChargePriceWei}
                    stunPrice={stunChargePriceWei}
                    boostTxQueueId={`${planetId}-boost-charge`}
                    stunTxQueueId={`${planetId}-stun-charge`}
                    isBoostDisabled={gameOver || Number(planetEmpire) === 0}
                    isStunDisabled={gameOver || Number(planetEmpire) === 0}
                  />
                </Tabs.Pane>
              </Tabs>
              <Button
                onClick={() => OverridePaneExpanded.set({ value: !expanded })}
                variant="ghost"
                size="xs"
                className="self-end"
              >
                {expanded ? "-collapse" : "+expand"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
});
