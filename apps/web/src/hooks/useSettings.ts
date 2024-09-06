import { useEffect } from "react";

import { CHART_TICK_INTERVALS } from "@primodiumxyz/core";
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

const OpenRoutineProbabilities = createLocalBoolTable(settingsWorld, { id: "OpenRoutineProbabilities", persist: true });

const ChartConfig = createLocalTable(
  settingsWorld,
  { tickInterval: Type.Number },
  { id: "ChartConfig", persist: true, version: "1" },
);

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
    ChartConfig,
    OpenRoutineProbabilities,
    ShowRoutineLogs,
  };
};
