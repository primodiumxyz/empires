import { InterfaceIcons, SpriteKeys } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";

export const DEFAULT_EMPIRE = EEmpire.Red;

export const EmpireEnumToConfig: Record<
  EEmpire,
  {
    name: string;
    textColor: string;
    chartColor: string;
    icons: { magnet: string };
    sprites: { planet: SpriteKeys };
  }
> = {
  [EEmpire.LENGTH]: {
    name: "Length",
    textColor: "text-gray-400",
    chartColor: "rgba(128, 128, 128, .75)",
    icons: { magnet: "" },
    sprites: { planet: "Gold" },
  },
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
  [EEmpire.Yellow]: {
    name: "Yellow",
    textColor: "text-yellow-400",
    chartColor: "rgba(255, 255, 0, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetYellow" },
  },
  [EEmpire.Purple]: {
    name: "Purple",
    textColor: "text-purple-400",
    chartColor: "rgba(128, 0, 128, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPurple" },
  },

  [EEmpire.Pink]: {
    name: "Pink",
    textColor: "text-pink-400",
    chartColor: "rgba(255, 192, 203, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPink" },
  },
  [EEmpire.Orange]: {
    name: "Orange",
    textColor: "text-orange-400",
    chartColor: "rgba(255, 165, 0, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPink" },
  },
  [EEmpire.Black]: {
    name: "Black",
    textColor: "text-black-400",
    chartColor: "rgba(0, 0, 0, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPink" },
  },
  [EEmpire.White]: {
    name: "White",
    textColor: "text-white-400",
    chartColor: "rgba(255, 255, 255, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPink" },
  },
} as const;
