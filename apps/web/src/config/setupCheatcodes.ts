import { AccountClient, Core } from "@primodiumxyz/core";
import { ContractCalls } from "@/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";

export const setupCheatcodes = (core: Core, accountClient: AccountClient, contractCalls: ContractCalls) => {
  const { tables } = core;
  const { setTableValue } = contractCalls;

  const cheatcodes = [
    // createCheatcode({
    //   title: "Set counter",
    //   caption: "Set the counter to an arbitrary value.",
    //   inputs: {
    //     counter: {
    //       label: "value",
    //       inputType: "number",
    //       defaultValue: tables.Counter.get()?.value ?? BigInt(0),
    //     },
    //   },
    //   execute: async ({ counter: { value } }) => {
    //     const success = await setTableValue(tables.Counter, {}, { value: BigInt(value) });
    //     if (success) {
    //       console.log(`Counter set to ${value}`);
    //     } else {
    //       console.error("Failed to set counter");
    //     }
    //     return success;
    //   },
    // }),
  ];

  return cheatcodes;
};
