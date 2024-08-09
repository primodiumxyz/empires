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

  //DESTROYER ARC
  DestroyerArcUpperRed: "destroyer/upper/red",
  DestroyerArcUpperGreen: "destroyer/upper/green",
  DestroyerArcUpperBlue: "destroyer/upper/blue",
  DestroyerArcLowerRed: "destroyer/lower/red",
  DestroyerArcLowerBlue: "destroyer/lower/blue",
  DestroyerArcLowerGreen: "destroyer/lower/green",

  // Waves
  MagnetWaves: "waves",

  // Overheat flames
  OverheatFlamesLow: "overheat/low",
  OverheatFlamesMedium: "overheat/medium",
  OverheatFlamesFull: "overheat/full",
};

export type AnimationKeys = keyof typeof Animations;
