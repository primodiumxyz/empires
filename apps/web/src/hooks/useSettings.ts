import { useEffect } from "react";

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
    size: Type.String,
  },
  {
    id: "FontStyle",
    persist: true,
  },
);

export const fontStyleOptions = {
  family: ["pixel", "mono"],
  size: ["sm", "md"],
} as const;

FontStyle.set({
  family: fontStyleOptions.family[0],
  size: fontStyleOptions.size[0],
});

/* -------------------------------- Advanced -------------------------------- */
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

const AdvancedMode = createLocalBoolTable(settingsWorld, { id: "AdvancedMode", persist: true, version: "1" });

/* -------------------------------------------------------------------------- */
/*                                  SETTINGS                                  */
/* -------------------------------------------------------------------------- */

export const useSettings = () => {
  // font
  const fontStyle = FontStyle.use();
  const setFontStyleFamily = (family: (typeof fontStyleOptions.family)[number]) => FontStyle.update({ family });
  const setFontStyleSize = (size: (typeof fontStyleOptions.size)[number]) => FontStyle.update({ size });

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
      setFamily: setFontStyleFamily,
      setSize: setFontStyleSize,
    },
    showBlockchainUnits: {
      enabled,
      setEnabled: (enabled: boolean) => ShowBlockchainUnits.update({ value: enabled }),
    },
    Dripped,
    MusicPlaying,
    SelectedTab,
    AdvancedMode,
  };
};
