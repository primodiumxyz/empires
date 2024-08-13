import React from "react";

import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { defaultEntity, Entity } from "@primodiumxyz/reactive-tables";
import { Card } from "@/components/core/Card";
import { Tabs } from "@/components/core/Tabs";
import { ChargeContent } from "@/components/OverridePopup/content/ChargeContent";
import { MagnetContent } from "@/components/OverridePopup/content/MagnetContent";
import { ShieldContent } from "@/components/OverridePopup/content/ShieldContent";
import { ShieldEaterContent } from "@/components/OverridePopup/content/ShieldEaterContent";
import { ShipContent } from "@/components/OverridePopup/content/ShipContent";
import { OverrideButton } from "@/components/OverridePopup/OverrideButton";
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

export const Buttons: React.FC = () => {
  return (
    <div className="w-54 relative flex h-44 w-80 items-center justify-center">
      <div className="relative z-10 translate-y-12">
        <OverrideButton index={4} icon="Expansion" axialCoord={{ q: -1, r: -1 }} tooltip="Shield Eater" />
        <OverrideButton index={2} icon="RedMagnet" axialCoord={{ q: 2, r: -1 }} tooltip="Magnets" />
        <OverrideButton index={3} icon="Shard" axialCoord={{ q: 1, r: 0 }} tooltip="Overheat" />
        <OverrideButton index={0} icon="Fleet" axialCoord={{ q: -1, r: 0 }} tooltip="Ships" />
        <OverrideButton index={1} icon="Defense" axialCoord={{ q: 0, r: 0 }} tooltip="Shields" />
      </div>
      <div className="absolute left-1/2 top-12 z-0 w-fit -translate-x-1/2 scale-75 opacity-75">
        <p className="mx-auto w-72 bg-secondary/25 p-1 text-center text-xl text-accent">SELECT OVERRIDE</p>
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
    <Tabs className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Buttons />
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
            description={"Protect planet when under attack"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <ShieldContent entity={selectedPlanet} />
        </Tabs.Pane>
        <Tabs.Pane index={2} className="w-full items-center gap-4">
          <Header
            title={"Magnets"}
            description={"Attracts ships from neighboring planets owned by the same empire"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <MagnetContent entity={selectedPlanet} />
        </Tabs.Pane>
        <Tabs.Pane index={3} className="w-full items-center gap-4">
          <Header
            title={"Overheat"}
            description={"All ships will be destroyed when fully overheated"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <ChargeContent entity={selectedPlanet} />
        </Tabs.Pane>
        <Tabs.Pane index={4} className="w-full items-center gap-4">
          <Header
            title={"Shield Eater"}
            description={"Feed the monster to destroy planet and surrounding planet shields"}
            planetName={entityToPlanetName(selectedPlanet)}
          />
          <ShieldEaterContent entity={selectedPlanet} />
        </Tabs.Pane>
      </Card>
    </Tabs>
  );
};
