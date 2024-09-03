import { useEffect } from "react";

import { EChartMode, EViewMode } from "@primodiumxyz/core";
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
const FontStyle = createLocalTable(
  settingsWorld,
  {
    family: Type.String,
    familyRaw: Type.String,
    size: Type.String,
  },
  {
    id: "FontStyle",
    persist: true,
  },
);

export const fontStyleOptions = {
  family: ["pixel", "mono"],
  familyRaw: ["Silkscreen", "Space Mono"],
  size: ["sm", "md"],
} as const;

FontStyle.set({
  family: fontStyleOptions.family[0],
  familyRaw: fontStyleOptions.familyRaw[0],
  size: fontStyleOptions.size[0],
});

const ShowBlockchainUnits = createLocalBoolTable(settingsWorld, {
  id: "ShowBlockchainUnits",
  persist: true,
});

const Dripped = createLocalBoolTable(settingsWorld, {
  id: "Dripped",
  persist: true,
});

const MusicPlaying = createLocalBoolTable(settingsWorld, {
  id: "MusicPlaying",
  persist: true,
});

ShowBlockchainUnits.set({ value: false });

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
  { mode: Type.Number, tickInterval: Type.Number },
  { id: "ChartConfig", persist: true, version: "1" },
);

if (!ChartConfig.get()?.mode) {
  ChartConfig.set({ mode: EChartMode.Lines, tickInterval: 60 });
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
    FontStyle,
    ShowBlockchainUnits,
    Dripped,
    MusicPlaying,
    SelectedTab,
    ViewMode,
    ChartConfig,
    OpenRoutineProbabilities,
    ShowRoutineLogs,
  };
};
