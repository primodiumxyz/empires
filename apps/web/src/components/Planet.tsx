import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { bigIntMin } from "@latticexyz/common/utils";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { EOverride } from "@primodiumxyz/contracts/config/enums";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Card } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Join } from "@/components/core/Join";
import { Marker } from "@/components/core/Marker";
import { Tabs } from "@/components/core/Tabs";
import { Tooltip } from "@/components/core/Tooltip";
import { Magnets } from "@/components/Magnets";
import { OverridePane } from "@/components/OverridePane";
import { PlaceMagnetOverridePane } from "@/components/PlaceMagnetOverridePane";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useEthPrice } from "@/hooks/useEthPrice";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { cn } from "@/util/client";

export const EmpireEnumToColor: Record<EEmpire, string> = {
  [EEmpire.Blue]: "fill-blue-600",
  [EEmpire.Green]: "fill-green-600",
  [EEmpire.Red]: "fill-red-600",
  [EEmpire.LENGTH]: "",
};

export const Planet: React.FC<{ entity: Entity; tileSize: number; margin: number }> = ({
  entity,
  tileSize,
  margin,
}) => {
  const { tables, utils } = useCore();
  const planet = tables.Planet.use(entity);
  const planetEmpire = (planet?.empireId ?? 0) as EEmpire;
  const [isInteractPaneVisible, setIsInteractPaneVisible] = useState(false);
  const interactButtonRef = useRef<HTMLButtonElement>(null);

  const [left, top] = useMemo(() => {
    const cartesianCoord = convertAxialToCartesian(
      { q: Number(planet?.q ?? 0n) - 100, r: Number(planet?.r ?? 0n) },
      tileSize + margin,
    );

    return [cartesianCoord.x, cartesianCoord.y];
  }, [planet, tileSize, margin]);

  useEffect(() => {
    const listener = tables.PlanetBattleRoutine.update$.subscribe(({ properties: { current } }) => {
      if (!current || current.planetId !== entity) return;
      const data = {
        planetId: current.planetId,
        deaths: bigIntMin(current.attackingShipCount, current.defendingShipCount),
        conquered: current.conquer,
      };
    });
    return () => {
      listener.unsubscribe();
    };
  }, [planet]);

  const handleInteractClick = () => {
    setIsInteractPaneVisible(!isInteractPaneVisible);
  };

  if (!planet) return null;

  return (
    <Marker id={entity} scene="MAIN" coord={{ x: left, y: top }} depth={-top}>
      <div className="relative flex w-[220px] select-none flex-col items-center opacity-75 drop-shadow-2xl transition-all hover:opacity-100">
        <Magnets planetId={entity} />
        <div className="group relative mt-20 flex flex-col items-center">
          <div className="flex flex-row-reverse items-end rounded-box rounded-b-none border border-secondary/25 bg-gradient-to-r from-slate-800/90 to-slate-900/75 px-1 text-center">
            <p className="font-mono text-[10px] opacity-70">
              ({(planet.q - 100n).toLocaleString()},{planet.r.toLocaleString()})
            </p>
            {/* dashboard button */}
            <Button
              variant="ghost"
              className="p-0 font-bold text-amber-400"
              onClick={() => {
                tables.SelectedPlanet.set({ value: entity });
                utils.openPane("dashboard");
              }}
            >
              {entityToPlanetName(entity)}
            </Button>
          </div>
          <div className="flex flex-row gap-1 rounded-box border border-secondary/25 bg-neutral/75 px-2 text-[.8em]">
            <Ships shipCount={planet.shipCount} />
            <Shields shieldCount={planet.shieldCount} />
            <GoldCount goldCount={planet.goldCount} />
          </div>

          <InteractButton
            className={cn(
              "h-full scale-75 opacity-50 transition-all group-hover:scale-100 group-hover:opacity-100",
              !planet?.empireId ? "pointer-events-none !opacity-0" : "",
            )}
            ref={interactButtonRef}
            onClick={handleInteractClick}
            isInteractPaneVisible={isInteractPaneVisible}
            planetId={entity}
            planetEmpire={planetEmpire}
          />
        </div>
      </div>
    </Marker>
  );
};

const InteractButton = forwardRef<
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
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const planet = tables.Planet.use(planetId);
  const [inputValue, setInputValue] = useState("1");

  const createShipPriceWei = useOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const killShipPriceWei = useOverrideCost(EOverride.KillShip, planetEmpire, BigInt(inputValue));
  const addShieldPriceWei = useOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const removeShieldPriceWei = useOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));

  const createShipPriceUsd = utils.weiToUsd(createShipPriceWei, price ?? 0);
  const killShipPriceUsd = utils.weiToUsd(killShipPriceWei, price ?? 0);
  const addShieldPriceUsd = utils.weiToUsd(addShieldPriceWei, price ?? 0);
  const removeShieldPriceUsd = utils.weiToUsd(removeShieldPriceWei, price ?? 0);

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
                  <Tabs.IconButton icon={InterfaceIcons.Crosshairs} text="MAGNET" index={2} />
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
                  <PlaceMagnetOverridePane planetId={planetId} />
                </Tabs.Pane>
              </Tabs>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
});

const GoldCount = ({ goldCount }: { goldCount: bigint }) => {
  return (
    <div className="pointer-events-auto relative z-50">
      <Tooltip tooltipContent={`GOLD`}>
        <p className="pointer-events-auto flex items-center justify-center gap-1.5">
          <IconLabel imageUri={InterfaceIcons.Vault} text={goldCount.toLocaleString()} />
        </p>
      </Tooltip>
    </div>
  );
};

const Ships = ({ shipCount }: { shipCount: bigint }) => {
  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIPS`}>
        <p className="flex items-center justify-center gap-2">
          <IconLabel imageUri={InterfaceIcons.Fleet} text={shipCount.toLocaleString()} />
        </p>
      </Tooltip>
    </div>
  );
};

const Shields = ({ shieldCount }: { shieldCount: bigint }) => {
  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIELDS`}>
        <p className="flex items-center justify-center">
          <IconLabel imageUri={InterfaceIcons.Defense} text={shieldCount.toLocaleString()} />
        </p>
      </Tooltip>
    </div>
  );
};
