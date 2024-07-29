import { GameConfig } from "@primodiumxyz/engine";
import { pack } from "@primodiumxyz/assets";

import { KEY } from "@game/lib/constants/common";

const gameConfig: GameConfig = {
  key: KEY,
  type: Phaser.WEBGL,
  parent: "phaser-container",
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  transparent: true,
  pixelArt: true,
  assetPack: pack,
  fps: {
    target: 30,
    min: 30,
    limit: 30,
  },
  dom: {
    createContainer: true,
    pointerEvents: "none",
  },
};

export default gameConfig;
