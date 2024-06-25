export enum EEmpire {
  Red,
  Blue,
  Green,
}

export enum EOrigin {
  North,
  Southeast,
  Southwest,
}
export enum EDirection {
  None,
  East,
  Southeast,
  Southwest,
  West,
  Northwest,
  Northeast,
}

export enum EMovement {
  None,
  Away,
  Lateral,
  Toward,
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
