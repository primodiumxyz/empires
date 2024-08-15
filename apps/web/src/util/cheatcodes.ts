import { TxReceipt } from "@primodiumxyz/core";

type Primitive = string | number | bigint | boolean;
type PrimitiveType = "string" | "number" | "bigint" | "boolean";

export type CheatcodeInputsBase = {
  [key: string]: {
    label: string;
    defaultValue?: Primitive;
    inputType?: PrimitiveType;
    options?: { id: string | number; value: Primitive }[];
  };
};

export type CheatcodeInputs<T extends CheatcodeInputsBase> = {
  [K in keyof T]: T[K] & { value: T[K]["defaultValue"]; id?: string | number };
};

export type Cheatcode<T extends CheatcodeInputsBase = CheatcodeInputsBase> = {
  title: string;
  caption: string;
  inputs: T;
  execute: (args: CheatcodeInputs<T>) => Promise<TxReceipt>;
  loading?: (args: CheatcodeInputs<T>) => string;
  success?: (args: CheatcodeInputs<T>) => string;
  error?: (args: CheatcodeInputs<T>) => string;
  bg?: string;
};

export const createCheatcode = <T extends CheatcodeInputsBase>(cheatcode: Cheatcode<T>): Cheatcode<T> => cheatcode;

export const formatValue = (inputType: PrimitiveType, value?: Primitive): Primitive => {
  if (inputType === "number") return Number(value) ?? 0;
  if (inputType === "bigint") return BigInt(value ?? 0);
  if (inputType === "boolean") return value === "true";
  return value ?? "";
};
