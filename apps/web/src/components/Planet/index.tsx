import { useEffect, useMemo, useRef, useState } from "react";
import { bigIntMin } from "@latticexyz/common/utils";

import { EEmpire } from "@primodiumxyz/contracts";
import { convertAxialToCartesian, entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Button } from "@/components/core/Button";
import { Marker } from "@/components/core/Marker";
import { GoldCount } from "@/components/Planet/GoldCount";
import { InteractButton } from "@/components/Planet/InteractButton";
import { PlanetCharge } from "@/components/Planet/PlanetCharge";
import { Shields } from "@/components/Planet/Shields";
import { Ships } from "@/components/Planet/Ships";
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
          <PlanetCharge planetId={entity} />
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
