export const Animations = {
  Holo: "hex/holo",

  //Pending
  PendingBlue: "pending/blue",
  PendingGreen: "pending/green",
  PendingRed: "pending/red",

  // Magnet
  MagnetBlue: "magnet/blue",
  MagnetGreen: "magnet/green",
  MagnetRed: "magnet/red",

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
};

export type AnimationKeys = keyof typeof Animations;
