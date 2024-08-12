import { EEmpire } from "@primodiumxyz/contracts";

export const EmpireEnumToConfig = {
  0: { name: "", textColor: "" },
  [EEmpire.Red]: { name: "Red", textColor: "text-red-400" },
  [EEmpire.Blue]: { name: "Blue", textColor: "text-blue-400" },
  [EEmpire.Green]: { name: "Green", textColor: "text-green-400" },
  [EEmpire.LENGTH]: { name: "All Empires", textColor: "text-gray-400" },
} as const;
