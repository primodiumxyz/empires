import { EEmpire } from "@primodiumxyz/contracts";

export const EmpireEnumToConfig = {
  [EEmpire.Blue]: { name: "Blue", color: "blue" },
  [EEmpire.Green]: { name: "Green", color: "green" },
  [EEmpire.Red]: { name: "Red", color: "red" },
  [EEmpire.LENGTH]: { name: "", color: "" },
} as const;
