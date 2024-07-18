import { useState } from "react";

import { InterfaceIcons } from "@primodiumxyz/assets";
import { useCore } from "@primodiumxyz/core/react";
import { Entity } from "@primodiumxyz/reactive-tables";
import { Card, GlassCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Tabs } from "@/components/core/Tabs";

export const Dashboard = () => {
  return (
    <Tabs className="flex items-center" persistIndexKey="dashboard">
      <Tabs.Button
        index={0}
        togglable
        size={"sm"}
        className="pointer-events-auto !z-0 !border-r-0 heropattern-topography-slate-500/10 animate-in fade-in zoom-in"
        style={{
          writingMode: "vertical-rl",
        }}
      >
        <IconLabel
          text="Dashboard"
          imageUri={InterfaceIcons.Navigator}
          className="gap-2 py-4"
          style={{
            writingMode: "vertical-lr",
          }}
        />
      </Tabs.Button>

      <Tabs.Pane index={0} fragment className="pointer-events-auto">
        <GlassCard direction={"left"} className="animate-in slide-in-from-right-full">
          <Card fragment noDecor>
            <DashboardPane />
          </Card>
        </GlassCard>
      </Tabs.Pane>
    </Tabs>
  );
};

const DashboardPane = () => {
  const { tables } = useCore();
  const planets = tables.Planet.useAll();
  const empires = tables.Faction.useAll();
  const [selectedPlanet, setSelectedPlanet] = useState(planets[0]);

  return (
    <div className="flex h-screen min-w-[400px] flex-col gap-4 p-2">
      <h2 className="text-sm font-semibold text-gray-300">Empires summary</h2>
      {empires.map((empire) => (
        <EmpireSummary key={empire} empireEntity={empire} />
      ))}
      <h2 className="text-sm font-semibold text-gray-300">Planets</h2>
      <span>- select planet</span>
      <PlanetSummary planetEntity={selectedPlanet} />
      <h2 className="text-sm font-semibold text-gray-300">Quick action (if planet owned)</h2>
      <PlanetQuickAction planetEntity={selectedPlanet} />
    </div>
  );
};

const EmpireSummary = ({ empireEntity }: { empireEntity: Entity }) => {
  const { tables } = useCore();
  const empire = tables.Faction.use(empireEntity)!;

  return (
    <>
      <span>- point price</span>
      <span>- owners? (# of wallets holding points)</span>
      <span>- total gold on owned planets</span>
      <span>- total destroyers on owned planets</span>
      <span>- total shields on owned planets</span>
    </>
  );
};

const PlanetSummary = ({ planetEntity }: { planetEntity: Entity }) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(planetEntity)!;

  return (
    <>
      <span>- empire/unowned</span>
      <span>- destroyers count</span>
      <span>- shields count</span>
      <span>- gold count</span>
      <span>- neighbors</span>
    </>
  );
};

const PlanetQuickAction = ({ planetEntity }: { planetEntity: Entity }) => {
  const { tables } = useCore();
  const planet = tables.Planet.use(planetEntity)!;

  if (planet.factionId === 0) return <span>planet is neutral</span>;

  return (
    <div className="flex gap-4">
      <button>add destroyer</button>
      <button>remove destroyer</button>
      <button>add shield</button>
      <button>remove shield</button>
    </div>
  );
};
