export enum EEmpire {
  Red,
  Blue,
  Green,
  LENGTH,
}

export enum EOrigin {
  North,
  Southeast,
  Southwest,
  LENGTH,
}
export enum EDirection {
  None,
  East,
  Southeast,
  Southwest,
  West,
  Northwest,
  Northeast,
  LENGTH,
}

export enum EMovement {
  None,
  Retreat,
  Lateral,
  Expand,
  LENGTH,
}

export enum EAction {
  CreateDestroyer,
  KillDestroyer,
  LENGTH,
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
