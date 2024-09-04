import { useEffect } from "react";

import { CHART_TICK_INTERVALS, EViewMode } from "@primodiumxyz/core";
import {
  createLocalBoolTable,
  createLocalNumberTable,
  createLocalTable,
  createWorld,
  Type,
} from "@primodiumxyz/reactive-tables";

const settingsWorld = createWorld();

/* -------------------------------------------------------------------------- */
/*                                   TABLES                                   */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- Font ---------------------------------- */

const Dripped = createLocalBoolTable(settingsWorld, {
  id: "Dripped",
  persist: true,
});

const MusicPlaying = createLocalBoolTable(settingsWorld, {
  id: "MusicPlaying",
  persist: true,
});

const SelectedTab = createLocalNumberTable(settingsWorld, {
  id: "SelectedTab",
  persist: true,
  version: "1",
});

const ViewMode = createLocalNumberTable(settingsWorld, { id: "ViewMode", persist: true, version: "1" });

const OpenRoutineProbabilities = createLocalBoolTable(settingsWorld, { id: "OpenRoutineProbabilities", persist: true });

if (!ViewMode.get()?.value) {
  ViewMode.set({ value: EViewMode.Dashboard });
}

const ChartConfig = createLocalTable(
  settingsWorld,
  { tickInterval: Type.Number },
  { id: "ChartConfig", persist: true, version: "1" },
);

if (!ChartConfig.get()) {
  ChartConfig.set({ tickInterval: CHART_TICK_INTERVALS[0].value });
}

// Display routine logs in the action log
const ShowRoutineLogs = createLocalBoolTable(settingsWorld, { id: "ShowRoutineLogs", persist: true });
/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

export type Settings = ReturnType<typeof useSettings>;
export const useSettings = () => {
  useEffect(() => {
    return () => {
      settingsWorld.dispose();
    };
  }, []);

  return {
    Dripped,
    MusicPlaying,
    SelectedTab,
    ViewMode,
    ChartConfig,
    OpenRoutineProbabilities,
    ShowRoutineLogs,
  };
};
