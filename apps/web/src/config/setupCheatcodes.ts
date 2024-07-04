import { AccountClient, Core } from "@primodiumxyz/core";
import { contractCalls } from "@/config/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";

export const setupCheatcodes = (core: Core, accountClient: AccountClient, contractCalls: contractCalls) => {
  const { tables, network } = core;

  const cheatcodes = [
    createCheatcode({
      title: "Set counter",
      caption: "Set the counter to an arbitrary value.",
      inputs: {
        value: {
          label: "value",
          inputType: "number",
          defaultValue: 0,
        },
      },
      execute: async (args) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return true;
      },
    }),
  ];

  return cheatcodes;
};
