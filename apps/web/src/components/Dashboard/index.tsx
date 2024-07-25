import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";
import { entityToPlanetName } from "@primodiumxyz/core";
import { useCore } from "@primodiumxyz/core/react";
import { Button } from "@/components/core/Button";
import { Card, GlassCard } from "@/components/core/Card";
import { IconLabel } from "@/components/core/IconLabel";
import { Tabs } from "@/components/core/Tabs";
import { EmpireSummary } from "@/components/Dashboard/EmpireSummary";
import { PlanetSummary } from "@/components/Dashboard/PlanetSummary";
import { cn } from "@/util/client";
import { EmpireEnumToName } from "@/util/lookups";

export const EmpireEnumToBorder: Record<EEmpire, string> = {
  [EEmpire.Blue]: "border border-blue-600",
  [EEmpire.Green]: "border border-green-600",
  [EEmpire.Red]: "border border-red-600",
  [EEmpire.LENGTH]: "",
};

/* ---------------------------------- PANE ---------------------------------- */
export const Dashboard = () => {
  return (
    <Tabs className="flex items-center" persistIndexKey="dashboard">
      <Tabs.Button
        index={0}
        togglable
        size={"content"}
        className="pointer-events-auto !z-0 rounded-r-none border-r-0 heropattern-topography-slate-500/10 animate-in fade-in zoom-in"
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
            <div className="flex h-screen min-w-[400px] flex-col gap-4 px-2 py-4 text-xs">
              <DashboardPane />
            </div>
          </Card>
        </GlassCard>
      </Tabs.Pane>
    </Tabs>
  );
};

/* --------------------------------- CONTENT -------------------------------- */
const DashboardPane = () => {
  const { tables } = useCore();
  const planets = tables.Planet.useAll().map((entity) => ({ entity, properties: tables.Planet.get(entity)! }));
  const selectedPlanet = tables.SelectedPlanet.use();
  const empires = [EEmpire.Red, EEmpire.Green, EEmpire.Blue] as const;

  if (selectedPlanet) return <PlanetSummary entity={selectedPlanet.value} back={() => tables.SelectedPlanet.clear()} />;

  return (
    <>
      <h2 className="text-sm font-semibold text-gray-300">Empires</h2>
      <div className="flex flex-col gap-2">
        {empires.map((empire) => (
          <EmpireSummary
            key={empire}
            empireId={empire}
            ownedPlanets={planets.filter((planet) => planet.properties.empireId === empire)}
          />
        ))}
      </div>
      <h2 className="text-sm font-semibold text-gray-300">Planets</h2>
      <div className="flex flex-col gap-2 overflow-y-scroll">
        {planets.map((planet) => {
          const {
            entity,
            properties: { empireId },
          } = planet;

          return (
            <Button
              key={entity}
              variant="neutral"
              className={cn(
                "flex h-14 items-center justify-start gap-4",
                empireId ? EmpireEnumToBorder[empireId as EEmpire] : "border-none",
              )}
              onClick={() => tables.SelectedPlanet.set({ value: entity })}
            >
              {/* TODO: map to planet image */}
              {/* <img src={EntityToPlanetSprites[planet.entity]} width={32} height={32} /> */}
              <img src={undefined} width={32} height={32} />
              <h3 className="text-sm font-semibold text-gray-300">{entityToPlanetName(entity)}</h3>
              <span>{empireId ? `(${EmpireEnumToName[empireId as EEmpire]})` : "unowned"}</span>
            </Button>
          );
        })}
      </div>
    </>
  );
};
