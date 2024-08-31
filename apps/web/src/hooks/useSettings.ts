import { useEffect } from "react";

import { EViewMode } from "@primodiumxyz/core";
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

// Display routine logs in the action log
const ShowRoutineLogs = createLocalBoolTable(settingsWorld, { id: "ShowRoutineLogs", persist: true });
/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

export const useSettings = () => {
  // font
  const fontStyle = FontStyle.use();
  const setFontStyleFamily = (family: (typeof fontStyleOptions.family)[number]) => FontStyle.update({ family });
  const setFontStyleSize = (size: (typeof fontStyleOptions.size)[number]) => FontStyle.update({ size });
  const setFontStyleFamilyRaw = (familyRaw: (typeof fontStyleOptions.familyRaw)[number]) =>
    FontStyle.update({ familyRaw });
  useEffect(() => {
    return () => {
      settingsWorld.dispose();
    };
  }, []);

  const enabled = ShowBlockchainUnits.use()?.value ?? false;
  return {
    fontStyle: {
      family: fontStyle?.family ?? fontStyleOptions.family[0],
      size: fontStyle?.size ?? fontStyleOptions.size[0],
      familyRaw: fontStyle?.familyRaw ?? fontStyleOptions.familyRaw[0],
      setFamily: setFontStyleFamily,
      setFamilyRaw: setFontStyleFamilyRaw,
      setSize: setFontStyleSize,
    },
    showBlockchainUnits: {
      enabled,
      setEnabled: (enabled: boolean) => ShowBlockchainUnits.update({ value: enabled }),
    },
    Dripped,
    MusicPlaying,
    SelectedTab,
    ViewMode,
    OpenRoutineProbabilities,
    ShowRoutineLogs,
  };
};
