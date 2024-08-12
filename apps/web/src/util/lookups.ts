import { InterfaceIcons } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";

export const EMPIRES = [EEmpire.Red, EEmpire.Blue, EEmpire.Green];
export const DEFAULT_EMPIRE = EEmpire.Red;
export const EMPIRES_COUNT = EEmpire.LENGTH - 1;

export const EmpireEnumToConfig = {
  0: { name: "", textColor: "" },
  [EEmpire.Red]: {
    name: "Red",
    textColor: "text-red-400",
    chartColor: "rgba(255, 0, 0, .75)",
    icons: { magnet: InterfaceIcons.RedMagnet },
    sprites: { planet: "PlanetRed" },
  },
  [EEmpire.Blue]: {
    name: "Blue",
    textColor: "text-blue-400",
    chartColor: "rgba(0, 0, 255, .75)",
    icons: { magnet: InterfaceIcons.BlueMagnet },
    sprites: { planet: "PlanetBlue" },
  },
  [EEmpire.Green]: {
    name: "Green",
    textColor: "text-green-400",
    chartColor: "rgba(0, 255, 0, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetGreen" },
  },
  [EEmpire.LENGTH]: {
    name: "All Empires",
    textColor: "text-gray-400",
    chartColor: "rgba(0, 0, 0, .75)",
    icons: { magnet: InterfaceIcons.RedMagnet },
    sprites: { planet: "PlanetRed" },
  },
} as const;
