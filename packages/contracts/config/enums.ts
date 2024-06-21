export enum EExample {
  Null,
  Nabs,
  Hank
} 

export const MUDEnums = {
  EExample: enumToArray(EExample),

};

function enumToArray(enumObj: object): [string ] {
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
