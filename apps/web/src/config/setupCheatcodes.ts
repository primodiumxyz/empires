import { AccountClient, Core } from "@primodiumxyz/core";
import { ContractCalls } from "@/contractCalls/createContractCalls";
import { createCheatcode } from "@/util/cheatcodes";

export const setupCheatcodes = (core: Core, accountClient: AccountClient, contractCalls: ContractCalls) => {
  const { tables } = core;
  const { createDestroyer, removeDestroyer, requestDrip, setTableValue } = contractCalls;

  const cheatcodes = [
    /* ------------------------------- DESTROYERS ------------------------------- */
    // create destroyers on a planet
    // ...
    // remove destroyers from a planet
    // ...
    // send destroyers from a planet to another
    // ...
    /* ---------------------------------- TIME ---------------------------------- */
    // advance turns
    // ...
    // fast forward to end of game
    // ...
    /* ---------------------------------- GOLD ---------------------------------- */
    // generate gold on selected planets (or all planets)
    // ...
    // spend gold on destroyers for a planet
    // ...
    /* --------------------------------- SHARES --------------------------------- */
    // mint shares from an empire
    // ...
    // increase pot
    // ...
    //
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
