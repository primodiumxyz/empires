import { forwardRef, ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
import { OverridePane } from "@/components/OverridePane";
import { useContractCalls } from "@/hooks/useContractCalls";
import { useNextDecreaseOverrideCost, useOverrideCost } from "@/hooks/useOverrideCost";
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
  // const [conquered, setConquered] = useState(false);
  const [isInteractPaneVisible, setIsInteractPaneVisible] = useState(false);
  const interactButtonRef = useRef<HTMLButtonElement>(null);

  const [left, top] = useMemo(() => {
    const cartesianCoord = convertAxialToCartesian(
      { q: Number(planet?.q ?? 0n) - 100, r: Number(planet?.r ?? 0n) },
      tileSize + margin,
    );

    return [cartesianCoord.x, cartesianCoord.y];
  }, [planet, tileSize, margin]);

  const handleInteractClick = () => {
    setIsInteractPaneVisible(!isInteractPaneVisible);
  };

  useEffect(() => {
    const unsubscribe = tables.PlanetBattleRoutine.watch(
      {
        onChange: ({ properties: { current } }) => {
          if (!current || current.planetId !== entity) return;
          const data = {
            planetId: current.planetId,
            deaths: bigIntMin(current.attackingShipCount, current.defendingShipCount),
            conquered: current.conquer,
          };
        },
      },
      { runOnInit: false },
    );

    return () => {
      unsubscribe();
    };
  }, [planet]);

  // close interact pane on turn change (which happens when gold could for any planet increases)
  useEffect(() => {
    const unsubscribe = tables.Planet.watch({
      onChange: ({ properties: { current, prev } }) => {
        if (!current || !prev) return;
        if (current.goldCount <= prev.goldCount) return;
        setIsInteractPaneVisible(false);
      },
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!planet) return null;

  return (
    <Marker id={entity} scene="MAIN" coord={{ x: left, y: top }} depth={-top}>
      <div className="relative mt-12 flex flex-col items-center drop-shadow-2xl">
        <div className="group relative flex flex-col items-center">
          <div className="flex flex-row-reverse items-end rounded-box rounded-b-none border border-secondary/25 bg-gradient-to-r from-secondary/50 to-secondary/25 px-1 text-center">
            <p className="font-mono text-[10px] opacity-70">
              ({(planet.q ?? 0n).toLocaleString()},{(planet.r ?? 0n).toLocaleString()})
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
          <div className="flex flex-row gap-1 rounded-box border border-secondary/25 bg-neutral/25 px-2 text-[.8em]">
            <Ships shipCount={planet.shipCount} planetId={entity} planetEmpire={planetEmpire} />
            <Shields shieldCount={planet.shieldCount} planetId={entity} planetEmpire={planetEmpire} />
            <GoldCount goldCount={planet.goldCount} entity={entity} />
          </div>

          <InteractButton
            className={cn(
              "scale-80 mt-1 h-full opacity-75 transition-all group-hover:scale-100 group-hover:opacity-100",
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

  const { tables } = useCore();
  const { createShip, removeShip, addShield, removeShield } = useContractCalls();
  const { gameOver } = useTimeLeft();
  const planet = tables.Planet.use(planetId);
  const expanded = tables.OverridePaneExpanded.use()?.value ?? false;
  const [inputValue, setInputValue] = useState("1");

  const createShipPriceWei = useOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const killShipPriceWei = useOverrideCost(EOverride.KillShip, planetEmpire, BigInt(inputValue));
  const addShieldPriceWei = useOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const removeShieldPriceWei = useOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));

  const nextCreateShipPriceWei = useNextDecreaseOverrideCost(EOverride.CreateShip, planetEmpire, BigInt(inputValue));
  const nextKillShipPriceWei = useNextDecreaseOverrideCost(EOverride.KillShip, planetEmpire, BigInt(inputValue));
  const nextAddShieldPriceWei = useNextDecreaseOverrideCost(EOverride.ChargeShield, planetEmpire, BigInt(inputValue));
  const nextRemoveShieldPriceWei = useNextDecreaseOverrideCost(EOverride.DrainShield, planetEmpire, BigInt(inputValue));

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
          <Card
            noDecor
            ref={InteractPaneRef}
            className="flex-row items-center justify-center gap-2 bg-slate-900/85 pb-1"
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <Tabs className="flex w-64 flex-col items-center gap-2">
                <Join>
                  <Tabs.IconButton icon={InterfaceIcons.Fleet} text="SHIPS" index={0} />
                  <Tabs.IconButton icon={InterfaceIcons.Defense} text="SHIELD" index={1} />
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
                  />
                </Tabs.Pane>
              </Tabs>
              <Button
                onClick={() => tables.OverridePaneExpanded.set({ value: !expanded })}
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

const GoldCount = ({ goldCount, entity }: { goldCount: bigint; entity: Entity }) => {
  const { tables } = useCore();

  const [goldFloatingTexts, setGoldFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const unsubscribe = tables.BuyShipsRoutine.watch(
      {
        onChange: ({ properties: { current } }) => {
          if (!current) return;
          const data = { planetId: current.planetId, shipCount: current.shipBought, goldSpent: current.goldSpent };
          if (data.planetId !== entity) return;

          // Add floating text
          setGoldFloatingTexts((prev) => [...prev, { id: nextId, text: `-${data.goldSpent}` }]);
          setNextId((prev) => prev + 1);

          // Remove the floating text after 3 seconds
          setTimeout(() => {
            setGoldFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
          }, 5000);
        },
      },
      { runOnInit: false },
    );

    return () => {
      unsubscribe();
    };
  }, [nextId]);

  return (
    <div className="pointer-events-auto relative z-50">
      <Tooltip tooltipContent={`GOLD`}>
        <p className="pointer-events-auto flex items-center justify-center gap-1.5">
          <IconLabel imageUri={InterfaceIcons.Vault} text={goldCount.toLocaleString()} />
        </p>
      </Tooltip>
      {goldFloatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};

const Ships = ({
  shipCount,
  planetId,
  planetEmpire,
}: {
  shipCount: bigint;
  planetId: Entity;
  planetEmpire: EEmpire;
}) => {
  const { tables } = useCore();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: ReactNode }[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const unsubscribe = tables.CreateShipOverride.watch(
      {
        onChange: ({ properties: { current } }) => {
          if (!current) return;
          const data = { planetId: current.planetId, shipCount: current.overrideCount };
          if (data.planetId !== planetId) return;

          // Add floating "+1" text
          setFloatingTexts((prev) => [...prev, { id: nextId, text: `+${data.shipCount}` }]);
          setNextId((prev) => prev + 1);

          // Remove the floating text after 3 seconds
          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
          }, 5000);
        },
      },
      { runOnInit: false },
    );

    return () => {
      unsubscribe();
    };
  }, [nextId]);

  useEffect(() => {
    const unsubscribe = tables.KillShipOverride.watch(
      {
        onChange: ({ properties: { current } }) => {
          if (!current) return;
          const data = { planetId: current.planetId, shipCount: current.overrideCount };
          if (data.planetId !== planetId) return;

          // Add floating "+1" text
          setFloatingTexts((prev) => [...prev, { id: nextId, text: `-${data.shipCount}` }]);
          setNextId((prev) => prev + 1);

          // Remove the floating text after 3 seconds
          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
          }, 5000);
        },
      },
      { runOnInit: false },
    );

    return () => {
      unsubscribe();
    };
  }, [nextId]);

  useEffect(() => {
    const unsubscribe = tables.BuyShipsRoutine.watch(
      {
        onChange: ({ properties: { current } }) => {
          console.log({ current });
          if (!current) return;
          const data = { planetId: current.planetId, shipCount: current.shipBought, goldSpent: current.goldSpent };
          if (data.planetId !== planetId) return;

          // Add floating text
          setFloatingTexts((prev) => [...prev, { id: nextId, text: `+${data.shipCount}` }]);
          setNextId((prev) => prev + 1);

          // Remove the floating text after 3 seconds
          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
          }, 5000);
        },
      },
      { runOnInit: false },
    );

    return () => {
      unsubscribe();
    };
  }, [nextId]);

  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIPS`}>
        <p className="flex items-center justify-center gap-2">
          <IconLabel imageUri={InterfaceIcons.Fleet} text={shipCount.toLocaleString()} />
        </p>
      </Tooltip>
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text pointer-events-none absolute left-1 top-0 z-50 w-fit -translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};

const Shields = ({
  shieldCount,
  planetId,
  planetEmpire,
}: {
  shieldCount: bigint;
  planetId: Entity;
  planetEmpire: EEmpire;
}) => {
  const { tables } = useCore();
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string }[]>([]);
  const [nextId, setNextId] = useState(0);
  const callback = (current: any, negative?: boolean) => {
    if (!current) return;
    const data = { planetId: current.planetId, shieldCount: current.overrideCount };
    if (data.planetId !== planetId) return;

    // Add floating text
    setFloatingTexts((prev) => [...prev, { id: nextId, text: `${negative ? "-" : "+"}${data.shieldCount}` }]);
    setNextId((prev) => prev + 1);

    // Remove the floating text after 3 seconds
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== nextId));
    }, 5000);
  };
  useEffect(() => {
    const unsubscribe1 = tables.ChargeShieldsOverride.watch(
      {
        onChange: ({ properties: { current } }) => callback(current),
      },
      { runOnInit: false },
    );
    const unsubscribe2 = tables.DrainShieldsOverride.watch(
      {
        onChange: ({ properties: { current } }) => callback(current, true),
      },
      { runOnInit: false },
    );

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [nextId]);

  return (
    <div className="relative z-50">
      <Tooltip tooltipContent={`SHIELDS`}>
        <p className="flex items-center justify-center">
          <IconLabel imageUri={InterfaceIcons.Defense} text={shieldCount.toLocaleString()} />
        </p>
      </Tooltip>

      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="floating-text pointer-events-none absolute right-1 top-0 z-50 w-fit translate-x-full rounded bg-white p-2 text-xs text-black"
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
