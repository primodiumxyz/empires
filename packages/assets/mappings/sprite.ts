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
};

export type SpriteKeys = keyof typeof Sprites;
