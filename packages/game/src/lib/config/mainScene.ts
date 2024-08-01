import { SceneConfig } from "@primodiumxyz/engine";

import { Scenes } from "@game/lib/constants/common";

export const mainSceneConfig: SceneConfig = {
  key: Scenes.Main,
  camera: {
    minZoom: 0.5,
    maxZoom: 1.25,
    defaultZoom: 1,
    pinchSpeed: 0.01,
    wheelSpeed: 1,
  },
  cullingChunkSize: 128,
  tilemap: {
    tileWidth: 1,
    tileHeight: 1,
  },
};
