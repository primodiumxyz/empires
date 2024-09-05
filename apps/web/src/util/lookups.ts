import { InterfaceIcons, SpriteKeys } from "@primodiumxyz/assets";
import { EEmpire } from "@primodiumxyz/contracts";

export const DEFAULT_EMPIRE = EEmpire.Red;

export type EmpireConfig = {
  name: string;
  textColor: string;
  bgColor: string;
  chartColor: string;
  icons: { magnet: string };
  sprites: { planet: SpriteKeys };
};

export const EmpireEnumToConfig: Record<EEmpire, EmpireConfig> = {
  [EEmpire.NULL]: {
    name: "None",
    textColor: "text-gray-400",
    bgColor: "bg-gray-600",
    chartColor: "rgba(128, 128, 128, .75)",
    icons: { magnet: "" },
    sprites: { planet: "Iridium" },
  },
  [EEmpire.LENGTH]: {
    name: "None",
    textColor: "text-gray-400",
    bgColor: "bg-gray-600",
    chartColor: "rgba(128, 128, 128, .75)",
    icons: { magnet: "" },
    sprites: { planet: "Iridium" },
  },
  [EEmpire.Red]: {
    name: "Red",
    textColor: "text-red-400",
    bgColor: "bg-red-600",
    chartColor: "rgba(255, 0, 0, .75)",
    icons: { magnet: InterfaceIcons.RedMagnet },
    sprites: { planet: "PlanetRed" },
  },
  [EEmpire.Blue]: {
    name: "Blue",
    textColor: "text-blue-300",
    bgColor: "bg-blue-600",
    chartColor: "rgba(100, 149, 237, .75)",
    icons: { magnet: InterfaceIcons.BlueMagnet },
    sprites: { planet: "PlanetBlue" },
  },
  [EEmpire.Green]: {
    name: "Green",
    textColor: "text-green-400",
    bgColor: "bg-green-600",
    chartColor: "rgba(0, 255, 0, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetGreen" },
  },
  [EEmpire.Yellow]: {
    name: "Yellow",
    textColor: "text-yellow-400",
    bgColor: "bg-yellow-600",
    chartColor: "rgba(255, 255, 0, .75)",
    icons: { magnet: InterfaceIcons.YellowMagnet },
    sprites: { planet: "PlanetYellow" },
  },
  [EEmpire.Purple]: {
    name: "Purple",
    textColor: "text-purple-400",
    bgColor: "bg-purple-600",
    chartColor: "rgba(160, 32, 240, .75)",
    icons: { magnet: InterfaceIcons.PurpleMagnet },
    sprites: { planet: "PlanetPurple" },
  },

  [EEmpire.Pink]: {
    name: "Pink",
    textColor: "text-pink-400",
    bgColor: "bg-pink-600",
    chartColor: "rgba(255, 192, 203, .75)",
    icons: { magnet: InterfaceIcons.PinkMagnet },
    sprites: { planet: "PlanetPink" },
  },
  [EEmpire.Orange]: {
    name: "Orange",
    textColor: "text-orange-400",
    bgColor: "bg-orange-600",
    chartColor: "rgba(255, 165, 0, .75)",
    icons: { magnet: InterfaceIcons.YellowMagnet },
    sprites: { planet: "PlanetPink" },
  },
  [EEmpire.Black]: {
    name: "Black",
    textColor: "text-black-400",
    bgColor: "bg-black-600",
    chartColor: "rgba(0, 0, 0, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPink" },
  },
  [EEmpire.White]: {
    name: "White",
    textColor: "text-white-400",
    bgColor: "bg-white-600",
    chartColor: "rgba(255, 255, 255, .75)",
    icons: { magnet: InterfaceIcons.GreenMagnet },
    sprites: { planet: "PlanetPink" },
  },
} as const;
