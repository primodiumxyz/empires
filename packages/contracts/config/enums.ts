export enum EEmpire {
  NULL,
  Red,
  Blue,
  Green,
  Yellow,
  Purple,
  Pink,
  Orange,
  Black,
  White,
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

export enum EOverride {
  CreateShip = 1,
  ChargeShield,
  PlaceMagnet,
  DetonateShieldEater,
  AirdropGold,
  LENGTH,
}

export enum ERoutine {
  BuyShips = 1,
  BuyShields,
  AccumulateGold,
  LENGTH,
}

export const MUDEnums = {
  EEmpire: enumToArray(EEmpire, { skipNull: true }),
  EOrigin: enumToArray(EOrigin),
  EDirection: enumToArray(EDirection),
  EMovement: enumToArray(EMovement),
  ERoutine: enumToArray(ERoutine),
  EOverride: enumToArray(EOverride),
};
function enumToArray(enumObj: object, options?: { skipNull?: boolean }): [string] {
  if (options?.skipNull) {
    return [...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
  }
  return ["NULL", ...Object.keys(enumObj).filter((key) => isNaN(Number(key)))] as [string];
}
