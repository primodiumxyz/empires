import { createCheatcode } from "@/util/cheatcodes";

const testCheatcode = createCheatcode({
  title: "Test cheatcode",
  caption: "This is a test cheatcode",
  inputs: {
    stringArg: {
      label: "arg string",
      inputType: "text",
      defaultValue: "test",
    },
    numberArg: {
      label: "arg number",
      inputType: "number",
      defaultValue: 4,
    },
    bigintArg: {
      label: "arg bigint",
      inputType: "number",
      defaultValue: BigInt(4),
    },
    booleanArg: {
      label: "arg boolean",
      inputType: "text",
      defaultValue: true as boolean,
    },
  },
  execute: async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  },
  category: "Test",
});

export const getCheatcodes = () => [testCheatcode];
