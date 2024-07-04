import { AccountClient, Core } from "@primodiumxyz/core";
import { ContractCalls } from "@/config/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";

export const setupCheatcodes = (core: Core, accountClient: AccountClient, contractCalls: ContractCalls) => {
  const { tables, network } = core;
  const { setTableValue } = contractCalls;

  const cheatcodes = [
    createCheatcode({
      title: "Set counter",
      caption: "Set the counter to an arbitrary value.",
      inputs: {
        counter: {
          label: "value",
          inputType: "number",
          defaultValue: 0,
        },
      },
      execute: async ({ counter: { value } }) => {
        await setTableValue(tables.Counter, [], { value: BigInt(value) }, () => console.log("Counter set to", value));
      },
    }),
  ];

  return cheatcodes;
};
