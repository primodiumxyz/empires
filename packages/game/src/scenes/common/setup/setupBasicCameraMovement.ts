import { Coord } from "@primodiumxyz/engine/types";
import { World } from "@primodiumxyz/reactive-tables";
import { PrimodiumScene } from "@game/types";

const SPEED = 750;
const ZOOM_SPEED = 5;
const SMOOTHNESS = 0.9;

export const setupBasicCameraMovement = (
  scene: PrimodiumScene,
  world: World,
  options: {
    zoomKeybind?: boolean;
    drag?: boolean;
    translateKeybind?: boolean;
    doubleClickZoom?: boolean;
    wheel?: boolean;
    center?: boolean;
  } = {}
) => {
  const { maxZoom, minZoom, wheelSpeed } = scene.config.camera;
  const {
    zoomKeybind = true,
    translateKeybind = true,
    doubleClickZoom = true,
    drag = true,
    wheel = true,
    center = true,
  } = options;

  //accumalate sub-pixel movement during a gametick and add to next game tick.
  let accumulatedX = 0;
  let accumulatedY = 0;
  let targetX = 0;
  let targetY = 0;

  let originDragPoint: Phaser.Math.Vector2 | undefined;

  function handleZoom(delta: number) {
    const zoom = scene.camera.phaserCamera.zoom;
    const zoomSpeed = scene.input.isDown("Modifier") ? ZOOM_SPEED / 3 : ZOOM_SPEED;

    const zoomAmount = zoomSpeed * (delta / 1000);
    if (scene.input.isDown("ZoomIn")) {
      const targetZoom = Math.min(zoom + zoomAmount, maxZoom);
      scene.camera.setZoom(targetZoom);
    }

    if (scene.input.isDown("ZoomOut")) {
      const targetZoom = Math.max(zoom - zoomAmount, minZoom);
      scene.camera.setZoom(targetZoom);
    }
  }

  function handleDrag() {
    const zoom = scene.camera.phaserCamera.zoom;

    if (scene.input.isDown("LeftClick")) {
      if (originDragPoint) {
        const { x, y } = scene.input.phaserInput.activePointer.position;
        const { x: prevX, y: prevY } = originDragPoint;

        const scrollX = scene.camera.phaserCamera.scrollX;
        const scrollY = scene.camera.phaserCamera.scrollY;

        const dx = Math.round((x - prevX) / zoom);
        const dy = Math.round((y - prevY) / zoom);

        scene.camera.setScroll(scrollX - dx, scrollY - dy);
      }
      originDragPoint = scene.phaserScene.input.activePointer.position.clone();
    } else {
      originDragPoint = undefined;
    }
  }

  function handleTranslate(delta: number) {
    // HANDLE CAMERA SCROLL MOVEMENT KEYS
    const speed = (scene.input.isDown("Modifier") ? SPEED / 3 : SPEED) / scene.camera.phaserCamera.zoom;
    const moveDistance = speed * (delta / 1000);
    let scrollX = scene.camera.phaserCamera.scrollX;
    let scrollY = scene.camera.phaserCamera.scrollY;
    let moveX = 0;
    let moveY = 0;
    if (scene.input.isDown("Up")) moveY--;
    if (scene.input.isDown("Down")) moveY++;
    if (scene.input.isDown("Left")) moveX--;
    if (scene.input.isDown("Right")) moveX++;

    //only register movement when no tweens are running
    if ((moveX !== 0 || moveY !== 0) && !scene.phaserScene.tweens.getTweensOf(scene.camera.phaserCamera).length) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      accumulatedX += (moveX / length) * moveDistance;
      accumulatedY += (moveY / length) * moveDistance;

      const integralMoveX = Math.floor(accumulatedX);
      const integralMoveY = Math.floor(accumulatedY);

      accumulatedX -= integralMoveX;
      accumulatedY -= integralMoveY;

      targetX += integralMoveX;
      targetY += integralMoveY;

      scrollX = Phaser.Math.Linear(scrollX, targetX, 1 - SMOOTHNESS);
      scrollY = Phaser.Math.Linear(scrollY, targetY, 1 - SMOOTHNESS);
      scene.camera.setScroll(scrollX, scrollY);
      return;
    }

    targetX = scene.camera.phaserCamera.scrollX;
    targetY = scene.camera.phaserCamera.scrollY;
  }

  function handleCenter() {
    if (scene.input.isDown("Center")) {
      scene.camera.pan({ x: 15, y: 6 });
    }
  }

  const handleGameTickMovement = (_: number, delta: number) => {
    if (zoomKeybind) handleZoom(delta);

    if (center) handleCenter();

    if (translateKeybind) handleTranslate(delta);

    if (drag) handleDrag();
  };

  scene.phaserScene.events.addListener("update", handleGameTickMovement);

  //handle double click events and zoom to mouse position
  const doubleClickSub = scene.input.doubleClick$.subscribe((event) => {
    if (!doubleClickZoom) return;

    //check if scene is active
    if (!scene.phaserScene.scene.isActive()) return;

    const { x, y } = scene.utils.pixelCoordToTileCoord({ x: event.worldX, y: event.worldY });

    const gameCoord = { x, y: -y } as Coord;

    //set to default zoomTo and pan to mouse position
    scene.camera.zoomTo(scene.config.camera.defaultZoom, 1000);
    scene.camera.pan(gameCoord);
  });

  //handle wheel zoom
  scene.phaserScene.input.on(
    "wheel",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: any, deltaY: number) => {
      if (!wheel) return;

      let scale = 0.0002;

      if (scene.input.isDown("Modifier")) scale /= 2;

      const camera = scene.camera.phaserCamera;
      // Get the current world point under pointer.
      const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
      const newZoom = camera.zoom - camera.zoom * scale * wheelSpeed * deltaY;
      scene.camera.setZoom(newZoom);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y);
      // Scroll the camera to keep the pointer under the same world point.
      scene.camera.setScroll(
        camera.scrollX - (newWorldPoint.x - worldPoint.x),
        camera.scrollY - (newWorldPoint.y - worldPoint.y)
      );
    }
  );

  world.registerDisposer(() => {
    doubleClickSub.unsubscribe();
    scene.input.phaserInput.off("wheel");
    scene.phaserScene.events.removeListener("update", handleGameTickMovement);
  }, "game");
};
