export enum EEmpire {
  Red = 1,
  Blue,
  Green,
}

export enum EOrigin {
  North = 1,
  Southeast,
  Southwest,
}
export enum EDirection {
  None = 1,
  East,
  Southeast,
  Southwest,
  West,
  Northwest,
  Northeast,
}

export enum EMovement {
  None = 1,
  Retreat,
  Lateral,
  Expand,
}

export const MUDEnums = {
  EEmpire: enumToArray(EEmpire),
  EOrigin: enumToArray(EOrigin),
  EDirection: enumToArray(EDirection),
  EMovement: enumToArray(EMovement),
};

function enumToArray(enumObj: object): [string] {
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
