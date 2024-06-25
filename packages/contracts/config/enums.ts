export enum EEmpire {
  Red,
  Blue,
  Green,
}

export const MUDEnums = {
  EEmpire: enumToArray(EEmpire),
};

function enumToArray(enumObj: object): [string] {
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
