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

  // Citadel
  CitadelCrown: "citadel/crown",
  // Treasure
  TreasurePlanet: "planet/treasure",

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

  Combat: "combat",

  // Waves
  MagnetWaves: "waves",

  // Shield eater
  ShieldEaterIdle: "shield-eater/idle",
  ShieldEaterEnter: "shield-eater/enter",
  ShieldEaterExit: "shield-eater/exit",
  ShieldEaterTarget: "shield-eater/target",
  ShieldEaterDetonate: "shield-eater/detonate",
  ShieldEaterCrack: "shield-eater/crack",

  // Acid Rain
  AcidRainLarge: "acid-rain/idle/large",
  AcidRainMedium: "acid-rain/idle/medium",
  AcidRainSmall: "acid-rain/idle/small",
  AcidRainEnterLarge: "acid-rain/enter/large",
  AcidRainEnterMedium: "acid-rain/enter/medium",
  AcidRainEnterSmall: "acid-rain/enter/small",
  AcidRainExit: "acid-rain/exit",

  // Citadel
  CitadelShine: "citadel/shine",

  // Gold
  AddIridium: "iridium/add",
};

export type AnimationKeys = keyof typeof Animations;
