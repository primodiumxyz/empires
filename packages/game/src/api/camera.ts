import { Coord, PixelCoord, Scene } from "@primodiumxyz/engine";
import { coordEq, pixelCoordToTileCoord, tileCoordToPixelCoord } from "@primodiumxyz/engine/src/lib/util/coords";

export const createCameraApi = (scene: Scene) => {
  function pan(
    coord: PixelCoord,
    options: {
      duration?: number;
      ease?: string;
    } = {},
  ) {
    const { phaserScene, camera } = scene;
    const { ease = "Power2", duration = 1000 } = options;

    const scroll = camera.phaserCamera.getScroll(coord.x, coord.y);

    //we want new tween to be active for responsive behavior. New tween are created if on new end coord.
    if (phaserScene.tweens.getTweensOf(camera.phaserCamera).length) {
      const currentTween = phaserScene.tweens.getTweensOf(camera.phaserCamera)[0];

      const endCoord = {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        x: currentTween.data[0]?.end ?? 0,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-expect-error
        y: currentTween.data[1]?.end ?? 0,
      };

      if (coordEq(endCoord, scroll)) return;

      phaserScene.tweens.killTweensOf(camera.phaserCamera);
    }

    phaserScene?.tweens.add({
      targets: camera.phaserCamera,
      scrollX: scroll.x,
      scrollY: scroll.y,
      duration,
      ease,
      onUpdate: () => {
        updateWorldView();
      },
    });
  }

  function zoomTo(zoom: number, duration = 1000, ease = "Power2") {
    const { camera } = scene;

    camera.phaserCamera.zoomTo(zoom, duration, ease, false, () => {
      scene.input.phaserInput.activePointer.updateWorldPoint(camera.phaserCamera);
      updateWorldView();
    });
  }

  function getPosition() {
    const { camera, tiled: tilemap } = scene;

    const coord = camera?.phaserCamera.worldView;
    if (!coord) throw new Error("Camera not found.");

    const tileCoord = pixelCoordToTileCoord(coord, tilemap.tileWidth, tilemap.tileHeight);

    return {
      x: tileCoord.x,
      y: -tileCoord.y,
    };
  }

  function updateWorldView() {
    const { camera } = scene;

    requestAnimationFrame(() => {
      camera.zoom$.next(camera.phaserCamera.zoom);
      camera.worldView$.next(camera.phaserCamera.worldView);
    });
  }

  function screenCoordToWorldCoord(screenCoord: Coord) {
    const { camera } = scene;

    const pixelCoord = camera.phaserCamera.getWorldPoint(screenCoord.x, screenCoord.y);

    return pixelCoord;
  }

  function worldCoordToScreenCoord(worldCoord: Coord) {
    const { camera } = scene;

    //convert canvas screen coord to phaser screen coord
    // Convert world coord to phaser screen coord
    const screenCoordX = (worldCoord.x - camera.phaserCamera.worldView.x) * camera.phaserCamera.zoom;
    const screenCoordY = (worldCoord.y - camera.phaserCamera.worldView.y) * camera.phaserCamera.zoom;

    return { x: screenCoordX, y: screenCoordY };
  }

  const shake = () => {
    const { camera } = scene;

    if (!scene.phaserScene.scene.isActive()) return;

    camera.phaserCamera.shake(300, 0.01 / camera.phaserCamera.zoom);
  };

  function createDOMContainer(id: string, coord: Coord, raw = false) {
    const {
      tiled: { tileHeight, tileWidth },
    } = scene;
    const pixelCoord = raw ? coord : tileCoordToPixelCoord(coord, tileWidth, tileHeight);
    pixelCoord.y = raw ? pixelCoord.y : -pixelCoord.y;

    const div = document.createElement("div");
    div.id = id;

    const obj = scene.phaserScene.add.dom(pixelCoord.x, pixelCoord.y, div);

    scene.phaserScene.data.set(id, { obj, container: div });

    return { obj, container: div };
  }

  const focusSequence = scene.phaserScene.add.timeline([]);
  let blurFx: Phaser.FX.Bokeh | undefined;
  function focusCamera(coord: Coord) {
    focusSequence.stop();
    focusSequence.events = [];
    return new Promise<void>((resolve) => {
      focusSequence
        .add([
          {
            at: 0,
            run: () => {
              pan(coord, { duration: 300 });

              if (blurFx) return;
              blurFx = scene.camera.phaserCamera.postFX.addTiltShift(0.1, 10, 0, 2, 2, 1);
            },
          },
          {
            at: 300,
            run: () => {
              zoomTo(scene.config.camera.maxZoom, 500);
            },
          },
          {
            at: 800,
            run: () => {
              resolve();
            },
          },
        ])
        .play();
    });
  }

  async function unfocusCamera() {
    focusSequence.stop();
    focusSequence.events = [];

    const promise = new Promise<void>((resolve) => {
      focusSequence
        .add([
          {
            at: 0,
            run: () => {
              if (blurFx) {
                scene.camera.phaserCamera.postFX.remove(blurFx);
                blurFx = undefined;
              }
              zoomTo(scene.config.camera.defaultZoom, 500);
            },
          },
          {
            at: 500,
            run: () => {
              resolve();
            },
          },
        ])
        .play();
    });

    return promise;
  }

  return {
    ...scene.camera,
    pan,
    zoomTo,
    getPosition,
    screenCoordToWorldCoord,
    worldCoordToScreenCoord,
    updateWorldView,
    shake,
    createDOMContainer,
    focusCamera,
    unfocusCamera,
  };
};
