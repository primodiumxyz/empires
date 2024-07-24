import { Scene } from "@primodiumxyz/engine";

import { createAudioApi } from "@game/api/audio";
import { createCameraApi } from "@game/api/camera";
import { createFxApi } from "@game/api/fx";
import { createHooksApi } from "@game/api/hooks";
import { createInputApi } from "@game/api/input";
import { createSpriteApi } from "@game/api/sprite";
import { createObjectApi } from "@game/api/objects";
import { createUtilApi } from "@game/api/utils";
import { GlobalApi } from "@game/api/global";

export function createSceneApi(scene: Scene, globalApi: GlobalApi) {
  const cameraApi = createCameraApi(scene);

  const apiObject = {
    phaserScene: scene.phaserScene,
    audio: createAudioApi(scene, globalApi),
    config: scene.config,
    camera: cameraApi,
    dispose: scene.dispose,
    fx: createFxApi(scene),
    hooks: createHooksApi(scene),
    input: createInputApi(scene, globalApi),
    objects: createObjectApi(scene),
    sprite: createSpriteApi(scene),
    utils: createUtilApi(scene),
    tiled: scene.tiled,
    global: globalApi,
    tables: globalApi.tables,
  };

  apiObject.audio.initializeAudioVolume();

  return apiObject;
}
