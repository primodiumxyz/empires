import { Scene } from "@primodiumxyz/engine";
import { createAudioApi } from "@game/api/audio";
import { createCameraApi } from "@game/api/camera";
import { createFxApi } from "@game/api/fx";
import { GlobalApi } from "@game/api/global";
import { createHooksApi } from "@game/api/hooks";
import { createInputApi } from "@game/api/input";
import { createObjectApi } from "@game/api/objects";
import { createSpriteApi } from "@game/api/sprite";
import { createUtilApi } from "@game/api/utils";

export function createSceneApi(scene: Scene, globalApi: GlobalApi) {
  const cameraApi = createCameraApi(scene);

  const apiObject = {
    phaserScene: scene.phaserScene,
    audio: createAudioApi(scene, globalApi),
    config: scene.config,
    camera: cameraApi,
    dispose: scene.dispose,
    fx: createFxApi(scene, globalApi),
    hooks: createHooksApi(scene, globalApi),
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
