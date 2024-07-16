export enum EEmpire {
  Red = 1,
  Blue,
  Green,
  LENGTH,
}

export enum EOrigin {
  North = 1,
  Southeast,
  Southwest,
  LENGTH,
}
export enum EDirection {
  None = 1,
  East,
  Southeast,
  Southwest,
  West,
  Northwest,
  Northeast,
  LENGTH,
}

export enum EMovement {
  None = 1,
  Retreat,
  Lateral,
  Expand,
  LENGTH,
}

export enum EPlayerAction {
  CreateDestroyer = 1,
  KillDestroyer,
  ChargeShield,
  DrainShield,
  LENGTH,
}

export enum ENPCAction {
  BuyDestroyers = 1,
  BuyShields,
  LENGTH,
}

export const MUDEnums = {
  EEmpire: enumToArray(EEmpire),
  EOrigin: enumToArray(EOrigin),
  EDirection: enumToArray(EDirection),
  EMovement: enumToArray(EMovement),
  ENPCAction: enumToArray(ENPCAction),
  EPlayerAction: enumToArray(EPlayerAction),
};

function enumToArray(enumObj: object): [string] {
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
