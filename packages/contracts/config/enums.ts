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
  East = 1,
  Southeast,
  Southwest,
  West,
  Northwest,
  Northeast,
}

export enum EMovement {
  Retreat = 1,
  Lateral,
  Expand,
}

export enum ENPCAction {
  BuyDestroyers = 1,
}

export const MUDEnums = {
  EEmpire: enumToArray(EEmpire),
  EOrigin: enumToArray(EOrigin),
  EDirection: enumToArray(EDirection),
  EMovement: enumToArray(EMovement),
  ENPCAction: enumToArray(ENPCAction),
};

function enumToArray(enumObj: object): [string] {
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
