import { forwardRef, useEffect, useRef, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { Join } from "@/components/core/Join";
import { Tabs } from "@/components/core/Tabs";
import { ChargeOverridePane } from "@/components/Planet/ChargeOverridePane";
import { OverridePane } from "@/components/Planet/OverridePane";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { cn } from "@/util/client";

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

  const { utils, tables } = useCore();
  const { price } = useEthPrice();
  const { createShip, removeShip, addShield, removeShield, boostCharge, stunCharge } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const planet = tables.Planet.use(planetId);
  const [inputValue, setInputValue] = useState("1");

  const createShipPriceWei = useOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const killShipPriceWei = useOverrideCost(EOverride.KillShip, planetEmpire, BigInt(inputValue));
  const addShieldPriceWei = useOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const removeShieldPriceWei = useOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));
  const boostChargePriceWei = useOverrideCost(EOverride.BoostCharge, planetEmpire, BigInt(inputValue));
  const stunChargePriceWei = useOverrideCost(EOverride.StunCharge, planetEmpire, BigInt(inputValue));

  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const removeShieldPriceUsd = utils.weiToUsd(removeShieldPriceWei, price ?? 0);
  const boostChargePriceUsd = utils.weiToUsd(boostChargePriceWei, price ?? 0);
  const stunChargePriceUsd = utils.weiToUsd(stunChargePriceWei, price ?? 0);

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
              <Tabs className="flex w-[350px] flex-col items-center gap-2">
                <Join>
                  <Tabs.IconButton icon={InterfaceIcons.Fleet} text="SHIPS" index={0} />
                  <Tabs.IconButton icon={InterfaceIcons.Defense} text="SHIELD" index={1} />
                  <Tabs.IconButton icon={InterfaceIcons.Shard} text="CHARGE" index={2} />
                </Join>
                <Tabs.Pane index={0} className="w-full items-center gap-4">
                  <OverridePane
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onAttackClick={() => {
                      removeShip(planetId, BigInt(inputValue), boostChargePriceWei);
                      setInputValue("1");
                    }}
                    onSupportClick={() => {
                      createShip(planetId, BigInt(inputValue), createShipPriceWei);
                      setInputValue("1");
                    }}
                    attackPrice={killShipPriceUsd}
                    supportPrice={createShipPriceUsd}
                    attackTxQueueId={`${planetId}-kill-ship`}
                    supportTxQueueId={`${planetId}-create-ship`}
                    isSupportDisabled={gameOver || Number(planetEmpire) === 0}
                    isAttackDisabled={
                      (planet?.shipCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planetEmpire) === 0
                    }
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
                    attackPrice={removeShieldPriceUsd}
                    supportPrice={addShieldPriceUsd}
                    attackTxQueueId={`${planetId}-remove-shield`}
                    supportTxQueueId={`${planetId}-add-shield`}
                    isSupportDisabled={gameOver || Number(planetEmpire) === 0}
                    isAttackDisabled={
                      (planet?.shieldCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planetEmpire) === 0
                    }
                  />
                </Tabs.Pane>
                <Tabs.Pane index={2} className="w-full items-center gap-4">
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
                    boostPrice={boostChargePriceUsd}
                    stunPrice={stunChargePriceUsd}
                    boostTxQueueId={`${planetId}-boost-charge`}
                    stunTxQueueId={`${planetId}-stun-charge`}
                    isBoostDisabled={gameOver || Number(planetEmpire) === 0}
                    isStunDisabled={gameOver || Number(planetEmpire) === 0}
                  />
                </Tabs.Pane>
              </Tabs>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
});
