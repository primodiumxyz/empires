import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

import { calculateAngleBetweenPoints } from "@primodiumxyz/core";
import { Coord } from "@primodiumxyz/engine";
import { DepthLayers, SceneKeys } from "@primodiumxyz/game";
import { useGame } from "@/hooks/useGame";
import { cn } from "@/util/client";

import { Button } from "./Button";
import { IconLabel } from "./IconLabel";

const BoundedMarker: React.FC<{ scene: SceneKeys; coord: Coord; iconUri: string; degrees: number }> = ({
  coord,
  scene,
  iconUri,
  degrees,
}) => {
  const game = useGame();

  const handleClick = useCallback(() => {
    const {
      camera: { pan },
      utils,
    } = game[scene];

    const tileCoord = utils.pixelCoordToTileCoord({ x: coord.x, y: -coord.y });

    pan(tileCoord);
  }, [coord, game, scene]);

  return (
    <Button
      shape="square"
      size="md"
      className="border border-secondary hover:border-accent hover:bg-secondary"
      onClick={handleClick}
    >
      <IconLabel imageUri={iconUri} className={`drop-shadow-hard text-xl`} />
      <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${degrees}deg)` }}>
        {/* <FaChevronRight size={24} className="absolute -right-10 top-1/2 -translate-y-1/2 font-bold text-success" /> */}
      </div>
    </Button>
  );
};

export const Marker: React.FC<{
  id: string;
  scene: SceneKeys;
  coord: Coord;
  children: ReactNode;
  noPointerEvents?: boolean;
  offScreenIconUri?: string;
  depth?: number;
  origin?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center"
    | "center-left"
    | "center-right"
    | "center-top"
    | "center-bottom";
}> = ({
  id,
  scene,
  coord,
  noPointerEvents,
  children,
  offScreenIconUri,
  depth = DepthLayers.Marker,
  origin = "center",
}) => {
  const game = useGame();
  const [marker, setMarker] = useState<Phaser.GameObjects.DOMElement>();
  const [container, setContainer] = useState<HTMLDivElement>();
  const [visible, setVisible] = useState(true);
  const [degrees, setDegrees] = useState(0);
  const camera = useRef(game[scene].camera).current;
  const uiCamera = useRef(game.UI.camera).current;
  const pointerEventsClass = noPointerEvents ? "pointer-events-none" : "pointer-events-auto";
  const translateClass = useMemo(() => {
    switch (origin) {
      case "top-left":
        return "";
      case "top-right":
        return "-translate-x-full";
      case "bottom-left":
        return "-translate-y-full";
      case "bottom-right":
        return "-translate-x-full -translate-y-full";
      case "center":
        return "-translate-x-1/2 -translate-y-1/2";
      case "center-left":
        return "-translate-y-1/2";
      case "center-right":
        return "-translate-x-full -translate-y-1/2";
      case "center-top":
        return "-translate-x-1/2";
      case "center-bottom":
        return "-translate-x-1/2 -translate-y-full";
      default:
        return "";
    }
  }, [origin]);

  const createContainer = useCallback(
    (_camera: typeof camera, id: string, coord: Coord) => {
      const { container, obj } = _camera.createDOMContainer(id, coord, true);
      obj.pointerEvents = "none";
      obj.setOrigin(0.5, 0.5);
      obj.setScale(1 / _camera.phaserCamera.zoom);
      obj.setAlpha(camera.phaserCamera.scene.scene.isActive() ? 1 : 0);
      obj.setDepth(depth);

      setMarker(obj);
      setContainer(container);
      return { container, obj };
    },
    [camera, depth],
  );

  //setup container on correct scene
  useEffect(() => {
    const { obj } = createContainer(!visible && offScreenIconUri ? uiCamera : camera, id, coord);

    return () => {
      obj.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, visible, offScreenIconUri]);

  useEffect(() => {
    marker?.setX(coord.x);
    marker?.setY(coord.y);
  }, [coord, marker]);

  useEffect(() => {
    if (!marker || !container) return;

    const cameraCallback = (view: Phaser.Geom.Rectangle) => {
      if (offScreenIconUri) {
        const shouldVisible = view.contains(coord.x, coord.y);
        if (shouldVisible !== visible) {
          setVisible(shouldVisible);
        }

        if (!visible) {
          const a = window.innerWidth / 3; // major axis
          const b = window.innerHeight / 3; // minor axis

          const { radian, degree } = calculateAngleBetweenPoints(
            { x: view.centerX, y: view.centerY },
            { x: coord.x, y: coord.y },
          );

          //convert to ellipse coordinates
          const r = Math.sqrt(1 / (Math.cos(radian) ** 2 / a ** 2 + Math.sin(radian) ** 2 / b ** 2));
          const markerX = r * Math.cos(radian) + window.innerWidth / 2;
          const markerY = r * Math.sin(radian) + window.innerHeight / 2;

          // Set the marker position
          marker.setPosition(markerX, markerY);
          setDegrees(degree);
          return;
        }
      }

      marker.setScale(1 / camera.phaserCamera.zoom);
    };

    cameraCallback(camera.phaserCamera.worldView);
    const cameraSub = camera.worldView$.subscribe(cameraCallback);

    marker.setPosition(coord.x, coord.y);

    return () => {
      cameraSub.unsubscribe();
    };
  }, [coord, visible, container, marker, camera, offScreenIconUri]);

  if (!marker || !container || !camera.phaserCamera.scene.scene.isActive()) return;

  return ReactDOM.createPortal(
    <div className={cn(pointerEventsClass, translateClass)}>
      {!visible && offScreenIconUri && (
        <BoundedMarker scene={scene} coord={coord} iconUri={offScreenIconUri} degrees={degrees} />
      )}
      {(visible || !offScreenIconUri) && children}
    </div>,
    container,
  );
};

export const IconMarker: React.FC<{
  id: string;
  scene: SceneKeys;
  coord: Coord;
  iconUri: string;
  depth?: number;
}> = ({ id, scene, coord, iconUri, depth }) => {
  return (
    <Marker id={id} scene={scene} depth={depth} coord={coord} offScreenIconUri={iconUri}>
      <IconLabel imageUri={iconUri} className={`drop-shadow-hard text-xl`} />
    </Marker>
  );
};
