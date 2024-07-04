import { createCheatcode } from "@/util/cheatcodes";

const testCheatcode = createCheatcode({
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
});

export const getCheatcodes = () => [
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
  testCheatcode,
];
