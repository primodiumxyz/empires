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
  Retreat,
  Lateral,
  Expand,
}

export enum EAction {
  CreateDestroyer,
  KillDestroyer,
}

export const MUDEnums = {
  EEmpire: enumToArray(EEmpire),
  EOrigin: enumToArray(EOrigin),
  EDirection: enumToArray(EDirection),
  EMovement: enumToArray(EMovement),
  EAction: enumToArray(EAction),
};

function enumToArray(enumObj: object): [string] {
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
