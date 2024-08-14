export const Animations = {
  Holo: "hex/holo",

  //Pending
  PendingBlue: "pending/blue",
  PendingGreen: "pending/green",
  PendingRed: "pending/red",
  PendingYellow: "pending/yellow",
  PendingPink: "pending/pink",
  PendingPurple: "pending/purple",

  // Magnet
  MagnetBlue: "magnet/blue",
  MagnetGreen: "magnet/green",
  MagnetRed: "magnet/red",
  MagnetYellow: "magnet/yellow",
  MagnetPink: "magnet/pink",
  MagnetPurple: "magnet/purple",

  //VFX --------------------------

  //CONQUER
  ConquerBlue: "conquer/blue",
  ConquerGreen: "conquer/green",
  ConquerRed: "conquer/red",
  ConquerYellow: "conquer/yellow",
  ConquerPink: "conquer/pink",
  ConquerPurple: "conquer/purple",

  MovementRed: "movement/red",
  MovementGreen: "movement/green",
  MovementBlue: "movement/blue",
  MovementYellow: "movement/yellow",
  MovementPink: "movement/pink",
  MovementPurple: "movement/purple",

  // Waves
  MagnetWaves: "waves",

  // Overheat flames
  OverheatFlamesLow: "overheat/low",
  OverheatFlamesMedium: "overheat/medium",
  OverheatFlamesFull: "overheat/full",

  // Shield eater
  ShieldEaterIdle: "shield-eater/idle",
  ShieldEaterDetonate: "shield-eater/detonate",
  ShieldEaterCrack: "shield-eater/crack",
};

export type AnimationKeys = keyof typeof Animations;
