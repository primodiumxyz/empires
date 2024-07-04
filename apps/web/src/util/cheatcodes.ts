type Primitive = string | number | bigint | boolean;

export type CheatcodeInputsBase = {
  [key: string]: {
    label: string;
    inputType?: "text" | "number";
    defaultValue: Primitive;
  };
};

export type CheatcodeInputs<T extends CheatcodeInputsBase> = {
  [K in keyof T]: T[K] & { value: T[K]["defaultValue"] };
};

export type Cheatcode<T extends CheatcodeInputsBase = CheatcodeInputsBase> = {
  title: string;
  caption: string;
  inputs: T;
  execute: (args: CheatcodeInputs<T>) => Promise<void>; // TODO: return success to notify, when execute will return status
};

export const createCheatcode = <T extends CheatcodeInputsBase>(cheatcode: Cheatcode<T>): Cheatcode<T> => cheatcode;
