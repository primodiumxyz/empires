import { Scene } from "@primodiumxyz/engine";

import { createAudioApi } from "@game/api/audio";
import { createCameraApi } from "@game/api/camera";
import { createFxApi } from "@game/api/fx";
import { createHooksApi } from "@game/api/hooks";
import { createInputApi } from "@game/api/input";
import { createSpriteApi } from "@game/api/sprite";
import { createObjectApi } from "@game/api/objects";
import { createUtilApi } from "@game/api/utils";
import { Core } from "@primodiumxyz/core";

export function createSceneApi(scene: Scene, core: Core) {
  const cameraApi = createCameraApi(scene);

  const apiObject = {
    phaserScene: scene.phaserScene,
    audio: createAudioApi(scene, core),
    config: scene.config,
    camera: cameraApi,
    dispose: scene.dispose,
    fx: createFxApi(scene),
    hooks: createHooksApi(scene),
    input: createInputApi(scene, core),
    objects: createObjectApi(scene),
    sprite: createSpriteApi(scene),
    utils: createUtilApi(scene),
    tiled: scene.tiled,
  };

  apiObject.audio.initializeAudioVolume();

  return apiObject;
}
