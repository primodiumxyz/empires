import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDoubleDownIcon, ChevronDownIcon } from "@heroicons/react/24/solid";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire, EOverride } from "@primodiumxyz/contracts/config/enums";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { EmpireToPlanetSpriteKeys } from "@primodiumxyz/game";
import { defaultEntity } from "@primodiumxyz/reactive-tables";
import { Badge } from "@/components/core/Badge";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { Marker } from "@/components/core/Marker";
import { Tabs } from "@/components/core/Tabs";
import { OverridePane } from "@/components/OverrideDrawer/OverridePane";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useGame } from "@/hooks/useGame";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";

export const OverrideDrawer = () => {
  const InteractPaneRef = useRef<HTMLDivElement>(null);

  const { utils, tables } = useCore();
  const {
    MAIN: { sprite, objects },
  } = useGame();
  const { price } = useEthPrice();
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const selectedPlanet = tables.SelectedPlanet.use()?.value;
  const planet = tables.Planet.use(selectedPlanet ?? defaultEntity);
  const [inputValue, setInputValue] = useState("1");

  const createShipPriceWei = useOverrideCost(
    EOverride.CreateShip,
    planet?.empireId ?? (0 as EEmpire),
    BigInt(inputValue),
  );
  const killShipPriceWei = useOverrideCost(EOverride.KillShip, planet?.empireId ?? (0 as EEmpire), BigInt(inputValue));
  const addShieldPriceWei = useOverrideCost(
    EOverride.ChargeShield,
    planet?.empireId ?? (0 as EEmpire),
    BigInt(inputValue),
  );
  const removeShieldPriceWei = useOverrideCost(
    EOverride.DrainShield,
    planet?.empireId ?? (0 as EEmpire),
    BigInt(inputValue),
  );

  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const removeShieldPriceUsd = utils.weiToUsd(removeShieldPriceWei, price ?? 0);

  const planetObj = useMemo(() => {
    if (!selectedPlanet) return;
    return objects.planet.get(selectedPlanet);
  }, [selectedPlanet]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (InteractPaneRef.current && !InteractPaneRef.current.contains(event.target as Node)) {
        tables.SelectedPlanet.remove();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!selectedPlanet || !planet) return null;

  return (
    <div className="origin-bottom scale-150">
      <Card
        noDecor
        ref={InteractPaneRef}
        className="flex-row items-center justify-center bg-slate-900 duration-300 ease-in-out animate-in fade-in slide-in-from-bottom"
      >
        <Badge
          size="lg"
          variant="primary"
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-b-none"
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
          {/* <div className="absolute size-16 animate-bounce bg-black/50 blur-md" /> */}
          {/* <ChevronDoubleDownIcon className="absolute size-16 animate-bounce text-error" /> */}
          <img src={InterfaceIcons.Crosshairs} className="pixel-images w-14 animate-pulse text-error" />
        </Marker>

        <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2">
          <Button
            variant="primary"
            shape="circle"
            size="sm"
            className="p-1"
            onClick={() => tables.SelectedPlanet.remove()}
          >
            <img src={InterfaceIcons.Return} />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center gap-1">
          <Tabs className="flex w-72 flex-col items-center gap-2">
            <Join>
              <Tabs.IconButton icon={InterfaceIcons.Fleet} text="SHIPS" index={0} />
              <Tabs.IconButton icon={InterfaceIcons.Defense} text="SHIELD" index={1} />
            </Join>
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
                attackPrice={killShipPriceUsd}
                supportPrice={createShipPriceUsd}
                attackTxQueueId={`${selectedPlanet}-kill-ship`}
                supportTxQueueId={`${selectedPlanet}-create-ship`}
                isSupportDisabled={gameOver || Number(selectedPlanet) === 0}
                isAttackDisabled={
                  (planet?.shipCount ?? 0n) < BigInt(inputValue) || gameOver || Number(selectedPlanet) === 0
                }
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
                attackPrice={removeShieldPriceUsd}
                supportPrice={addShieldPriceUsd}
                attackTxQueueId={`${selectedPlanet}-remove-shield`}
                supportTxQueueId={`${selectedPlanet}-add-shield`}
                isSupportDisabled={gameOver || Number(selectedPlanet) === 0}
                isAttackDisabled={
                  (planet?.shieldCount ?? 0n) < BigInt(inputValue) || gameOver || Number(planet?.empireId) === 0
                }
              />
            </Tabs.Pane>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};
