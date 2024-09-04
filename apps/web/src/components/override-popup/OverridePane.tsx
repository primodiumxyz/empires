import React from "react";

import { EOverride } from "@primodiumxyz/contracts";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { Tabs } from "@/components/core/Tabs";
import { AcidRainContent } from "@/components/override-popup/content/AcidRainContent";
import { ShieldContent } from "@/components/override-popup/content/ShieldContent";
import { ShieldEaterContent } from "@/components/override-popup/content/ShieldEaterContent";
import { ShipContent } from "@/components/override-popup/content/ShipContent";
import { MagnetContent } from "@/components/override-popup/magnet";
import { OverrideButton } from "@/components/override-popup/OverrideButton";
import { useOverrideCost } from "@/hooks/useOverrideCost";
import { cn } from "@/util/client";

export const Header: React.FC<{ title: string; description: string; planetName: string }> = ({
  title,
  description,
  planetName,
}) => {
  return (
    <div className="text-center">
      <p className="w-full p-1 text-center text-sm text-accent">
        <span className="badge badge-secondary">{title}</span> on Planet{" "}
        <span className="text-warning">{planetName}</span>
      </p>
      <p className="text-xs opacity-75">{description}</p>
    </div>
  );
};

export const Buttons: React.FC<{ selectedPlanet: Entity; empire: number }> = ({ selectedPlanet, empire }) => {
  const createShipPriceWei = useOverrideCost(EOverride.CreateShip, empire, 1n);
  const createShieldPriceWei = useOverrideCost(EOverride.ChargeShield, empire, 1n);
  const createMagnetPriceWei = useOverrideCost(EOverride.PlaceMagnet, empire, 1n);
  const createShieldEaterPriceWei = useOverrideCost(EOverride.DetonateShieldEater, empire, 1n);
  const createAcidRainPriceWei = useOverrideCost(EOverride.PlaceAcid, empire, 1n);

  return (
    <div className="relative flex h-32 w-80 flex-col items-center justify-center">
      <p className="absolute left-1/2 top-0 mx-auto w-36 -translate-x-1/2 rounded-lg bg-secondary/25 p-1 text-center text-accent">
        SELECT ACTION
      </p>
      <div className="relative z-10 translate-y-5">
        <OverrideButton
          index={3}
          icon="ShieldEater"
          axialCoord={{ q: -1, r: -1 }}
          tooltip="Shield Eater"
          price={createShieldEaterPriceWei}
        />
        <OverrideButton
          index={4}
          icon="AcidRain"
          axialCoord={{ q: 2, r: -1 }}
          tooltip="Acid Rain"
          price={createAcidRainPriceWei}
        />
        <OverrideButton
          index={0}
          icon="Fleet"
          axialCoord={{ q: -1, r: 0 }}
          tooltip="Ships"
          price={createShipPriceWei}
        />
        <OverrideButton
          index={1}
          icon="Defense"
          axialCoord={{ q: 0, r: 0 }}
          tooltip="Shields"
          price={createShieldPriceWei}
        />
        <OverrideButton
          index={2}
          icon="Magnet"
          axialCoord={{ q: 1, r: 0 }}
          tooltip="Magnets"
          price={createMagnetPriceWei}
        />
      </div>
    </div>
  );
};

export const OverridePane: React.FC<{ entity: Entity; className?: string }> = ({
  entity: selectedPlanet,
  className,
}) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(selectedPlanet ?? defaultEntity);

  if (!selectedPlanet || !planet) return null;

  return (
    <Tabs
      persistIndexKey="overrides"
      className={cn("flex flex-col items-center justify-start gap-2", className)}
      defaultIndex={1}
    >
      <Buttons selectedPlanet={selectedPlanet} empire={planet.empireId} />
      <Card noDecor className="relative w-96 flex-row items-center justify-center bg-slate-900">
        <Tabs.Pane index={0} className="w-full items-center gap-4">
          <Header
            title={"Ships"}
            description={"Attack other planets"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <ShipContent entity={selectedPlanet} />
        </Tabs.Pane>
        <Tabs.Pane index={1} className="w-full items-center gap-4">
          <Header
            title={"Shields"}
            description={"Defend planet when under attack"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <ShieldContent entity={selectedPlanet} />
        </Tabs.Pane>
        <Tabs.Pane index={2} className="w-full items-center gap-4">
          <Header
            title={"Magnets"}
            description={"Attracts ships owned by the same empire"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <MagnetContent entity={selectedPlanet} />
        </Tabs.Pane>

        <Tabs.Pane index={3} className="w-full items-center gap-4">
          <Header
            title={"Shield Eater"}
            description={"Destroy shields on this planet and surrounding planets"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <ShieldEaterContent entity={selectedPlanet} />
        </Tabs.Pane>

        <Tabs.Pane index={4} className="w-full items-center gap-4">
          <Header
            title={"Acid Rain"}
            description={"Acid Rain decays ships by 20% each turn"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <AcidRainContent entity={selectedPlanet} />
        </Tabs.Pane>
      </Card>
    </Tabs>
  );
};
