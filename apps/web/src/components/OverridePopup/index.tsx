import { useEffect, useMemo, useRef, useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { createLocalBoolTable, createWorld, defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { Marker } from "@/components/core/Marker";
import { Tabs } from "@/components/core/Tabs";
import { ChargeButton } from "@/components/OverridePopup/buttons/ChargeButton";
import { MagnetButton } from "@/components/OverridePopup/buttons/MagnetButton";
import { ShieldsButton } from "@/components/OverridePopup/buttons/ShieldsButton";
import { ShipsButton } from "@/components/OverridePopup/buttons/ShipsButton";
import { ChargeOverridePane } from "@/components/OverridePopup/ChargeOverridePane";
import { OverrideButton } from "@/components/OverridePopup/OverrideButton";
import { OverridePane } from "@/components/OverridePopup/OverridePane";
import { PlaceMagnetOverridePane } from "@/components/OverridePopup/PlaceMagnetOverridePane";
import { PlanetSummary } from "@/components/OverridePopup/PlanetSummary";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useGame } from "@/hooks/useGame";
import { useNextTurnOverrideCost, useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";

const OverridePaneExpanded = createLocalBoolTable(createWorld(), {
  id: "OverridePaneExpanded",
  persist: true,
  version: "1",
});

export const OverridePopup = () => {
  const { tables } = useCore();
  const {
    MAIN: { sprite, objects },
  } = useGame();
  const { createShip, removeShip, addShield, removeShield, boostCharge, stunCharge } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const selectedPlanet = tables.SelectedPlanet.use()?.value;
  const planet = tables.Planet.use(selectedPlanet ?? defaultEntity);
  const planetEmpire = planet?.empireId ?? (0 as EEmpire);
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

  const planetObj = useMemo(() => {
    if (!selectedPlanet) return;
    return objects.planet.get(selectedPlanet);
  }, [selectedPlanet]);

  if (!selectedPlanet || !planet) return null;

  return (
    <div className="screen-container pointer-events-none relative flex items-center justify-center gap-2 bg-slate-900/25 backdrop-blur-md">
      <div className="screen-container pointer-events-auto absolute" onClick={() => tables.SelectedPlanet.remove()} />
      <div className="flex h-screen items-center justify-center gap-2 py-10">
        <PlanetSummary entity={selectedPlanet} />
        <Card noDecor className="flex-row items-center justify-center bg-slate-900">
          <Badge
            size="lg"
            variant="neutral"
            className="absolute left-1/2 top-0 !w-56 -translate-x-1/2 -translate-y-full rounded-b-none border-secondary"
          >
            <IconLabel
              imageUri={sprite.getSprite(EmpireToPlanetSpriteKeys[planet.empireId as EEmpire] ?? "PlanetGrey")}
              text={entityToPlanetName(selectedPlanet)}
            />
          </Badge>

          <Marker
            id={selectedPlanet}
            scene="MAIN"
            coord={{ x: planetObj?.coord.x ?? 0, y: (planetObj?.coord.y ?? 0) - 25 }}
            noPointerEvents
          >
            <img src={InterfaceIcons.Crosshairs} className="pixel-images w-14 animate-pulse text-error" />
          </Marker>

          <div className="flex flex-col items-center justify-center gap-1">
            <Tabs className="flex w-fit flex-col items-center gap-2">
              <div className="flex">
                <OverrideButton index={0} icon="Fleet" />
                <OverrideButton index={1} icon="Defense" />
                <OverrideButton index={2} icon="RedMagnet" />
                <OverrideButton index={3} icon="Shard" />
              </div>

              <Tabs.Pane index={0} className="w-full items-center gap-4">
                <OverridePane
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  onAttackClick={() => {
                    removeShip(selectedPlanet, BigInt(inputValue), killShipPriceWei);
                    setInputValue("1");
                  }}
                  onSupportClick={() => {
                    createShip(selectedPlanet, BigInt(inputValue), createShipPriceWei);
                    setInputValue("1");
                  }}
                  attackPrice={killShipPriceWei}
                  supportPrice={createShipPriceWei}
                  nextAttackPrice={nextKillShipPriceWei}
                  nextSupportPrice={nextCreateShipPriceWei}
                  attackTxQueueId={`${selectedPlanet}-kill-ship`}
                  supportTxQueueId={`${selectedPlanet}-create-ship`}
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
                    removeShield(selectedPlanet, BigInt(inputValue), removeShieldPriceWei);
                    setInputValue("1");
                  }}
                  onSupportClick={() => {
                    addShield(selectedPlanet, BigInt(inputValue), addShieldPriceWei);
                    setInputValue("1");
                  }}
                  attackPrice={removeShieldPriceWei}
                  supportPrice={addShieldPriceWei}
                  nextAttackPrice={nextRemoveShieldPriceWei}
                  nextSupportPrice={nextAddShieldPriceWei}
                  attackTxQueueId={`${selectedPlanet}-remove-shield`}
                  supportTxQueueId={`${selectedPlanet}-add-shield`}
                  isSupportDisabled={gameOver || Number(planetEmpire) === 0}
                  isAttackDisabled={
                    (planet?.shieldCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planetEmpire) === 0
                  }
                  expanded={expanded}
                />
              </Tabs.Pane>
              <Tabs.Pane index={2} className="w-full items-center gap-4">
                <PlaceMagnetOverridePane planetId={selectedPlanet} />
              </Tabs.Pane>
              <Tabs.Pane index={3} className="w-full items-center gap-4">
                <ChargeOverridePane
                  inputValue={inputValue}
                  planetId={selectedPlanet}
                  onInputChange={setInputValue}
                  onBoostClick={() => {
                    boostCharge(selectedPlanet, BigInt(inputValue), boostChargePriceWei);
                    setInputValue("1");
                  }}
                  onStunClick={() => {
                    stunCharge(selectedPlanet, BigInt(inputValue), stunChargePriceWei);
                    setInputValue("1");
                  }}
                  boostPrice={boostChargePriceWei}
                  stunPrice={stunChargePriceWei}
                  boostTxQueueId={`${selectedPlanet}-boost-charge`}
                  stunTxQueueId={`${selectedPlanet}-stun-charge`}
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
    </div>
  );
};
