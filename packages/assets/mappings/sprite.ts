export const Sprites = {
  //HEXES
  HexRed: "sprites/hex/hex_red.png",
  HexBlue: "sprites/hex/hex_blue.png",
  HexGreen: "sprites/hex/hex_green.png",
  HexGrey: "sprites/hex/hex_grey.png",

  //PLANETS
  PlanetRed: "sprites/planet/planet_red.png",
  PlanetBlue: "sprites/planet/planet_blue.png",
  PlanetGreen: "sprites/planet/planet_green.png",
  PlanetGrey: "sprites/planet/planet_grey.png",
  PlanetUnderglow: "sprites/planet/planet_underglow.png",

  //ICONS
  Ship: "sprites/icons/ship.png",
  Shield: "sprites/icons/shield.png",
  Gold: "sprites/icons/gold.png",
  Attack: "sprites/icons/attack.png",

  //Background
  StarBg: "sprites/background/star.png",
  Nebula: "sprites/background/nebula.png",

  // Overheat border
  // TODO: There must be a better way to do this like with animations/animationConfig
  OverheatBorder0: "sprites/overheat-border/Overheat_Border_0.png",
  OverheatBorderRed1: "sprites/overheat-border/red/Overheat_Border_Red_1.png",
  OverheatBorderRed2: "sprites/overheat-border/red/Overheat_Border_Red_2.png",
  OverheatBorderRed3: "sprites/overheat-border/red/Overheat_Border_Red_3.png",
  OverheatBorderRed4: "sprites/overheat-border/red/Overheat_Border_Red_4.png",
  OverheatBorderRed5: "sprites/overheat-border/red/Overheat_Border_Red_5.png",
  OverheatBorderRed6: "sprites/overheat-border/red/Overheat_Border_Red_6.png",
  OverheatBorderBlue1: "sprites/overheat-border/blue/Overheat_Border_Blue_1.png",
  OverheatBorderBlue2: "sprites/overheat-border/blue/Overheat_Border_Blue_2.png",
  OverheatBorderBlue3: "sprites/overheat-border/blue/Overheat_Border_Blue_3.png",
  OverheatBorderBlue4: "sprites/overheat-border/blue/Overheat_Border_Blue_4.png",
  OverheatBorderBlue5: "sprites/overheat-border/blue/Overheat_Border_Blue_5.png",
  OverheatBorderBlue6: "sprites/overheat-border/blue/Overheat_Border_Blue_6.png",
  OverheatBorderGreen1: "sprites/overheat-border/green/Overheat_Border_Green_1.png",
  OverheatBorderGreen2: "sprites/overheat-border/green/Overheat_Border_Green_2.png",
  OverheatBorderGreen3: "sprites/overheat-border/green/Overheat_Border_Green_3.png",
  OverheatBorderGreen4: "sprites/overheat-border/green/Overheat_Border_Green_4.png",
  OverheatBorderGreen5: "sprites/overheat-border/green/Overheat_Border_Green_5.png",
  OverheatBorderGreen6: "sprites/overheat-border/green/Overheat_Border_Green_6.png",

  // TEMP
  Boost: "sprites/icons/TEMP_Boost.png",
  Stun: "sprites/icons/TEMP_Stun.png",
};

export type SpriteKeys = keyof typeof Sprites;
