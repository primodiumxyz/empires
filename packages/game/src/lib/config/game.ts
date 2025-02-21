import { pack } from "@primodiumxyz/assets";
import { GameConfig } from "@primodiumxyz/engine";
import { KEY } from "@game/lib/constants/common";

const gameConfig: GameConfig = {
  key: KEY,
  type: Phaser.WEBGL,
  parent: "phaser-container",
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  antialias: false,
  antialiasGL: false,
  assetPack: pack,
  dom: {
    createContainer: true,
    pointerEvents: "none",
  },
};

export default gameConfig;
