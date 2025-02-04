import { BehaviorSubject, share } from "rxjs";

import { CameraConfig } from "@engine/lib/types";

export function createCamera(phaserCamera: Phaser.Cameras.Scene2D.Camera, options: CameraConfig) {
  let controlsDisabled = false;

  const worldView$ = new BehaviorSubject<Phaser.Cameras.Scene2D.Camera["worldView"]>(phaserCamera.worldView).pipe(
    share(),
  ) as BehaviorSubject<Phaser.Cameras.Scene2D.Camera["worldView"]>;
  const zoom$ = new BehaviorSubject<number>(phaserCamera.zoom).pipe(share()) as BehaviorSubject<number>;

  const onResize = () => {
    requestAnimationFrame(() => worldView$.next(phaserCamera.worldView));
  };

  const disableControls = () => {
    controlsDisabled = true;
  };

  const enableControls = () => {
    controlsDisabled = false;
  };

  phaserCamera.scene.scale.addListener("resize", onResize);

  function setZoom(zoom: number) {
    if (controlsDisabled) return;
    const { minZoom, maxZoom } = options;
    const _zoom = Phaser.Math.Clamp(zoom, minZoom, maxZoom);
    phaserCamera.setZoom(_zoom);
    zoom$.next(_zoom);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    phaserCamera.preRender();
    requestAnimationFrame(() => {
      worldView$.next(phaserCamera.worldView);
    });
  }

  function setScroll(x: number, y: number) {
    if (controlsDisabled) return;
    phaserCamera.setScroll(x, y);
    requestAnimationFrame(() => worldView$.next(phaserCamera.worldView));
  }

  return {
    phaserCamera,
    worldView$,
    zoom$,
    dispose: () => {
      zoom$.unsubscribe();
      worldView$.unsubscribe();
      phaserCamera.scene.scale.removeListener("resize", onResize);
    },
    setScroll,
    setZoom,
    disableControls,
    enableControls,
  };
}
