import { useEffect, useMemo, useState } from "react";
import { clone, throttle } from "lodash";

import { Channel, Scene } from "@primodiumxyz/engine";
import { GlobalApi } from "@game/api/global";
import { defaultVolume } from "@game/lib/tables/VolumeTable";

export function createHooksApi(targetScene: Scene, globalApi: GlobalApi) {
  function useCamera() {
    const [worldView, setWorldView] = useState<Phaser.Geom.Rectangle>();
    const [zoom, setZoom] = useState(targetScene.camera.phaserCamera.zoom);
    const { camera } = targetScene;

    useEffect(() => {
      const worldViewListener = camera?.worldView$.subscribe(
        throttle((worldView: Phaser.Geom.Rectangle) => {
          setWorldView(clone(worldView));
        }, 50),
      );

      const zoomListener = camera?.zoom$.subscribe(throttle(setZoom, 100));

      return () => {
        worldViewListener?.unsubscribe();
        zoomListener?.unsubscribe();
      };
    }, [camera]);

    return {
      zoom,
      worldView,
    };
  }

  function useVolume(channel: "master" | Channel) {
    const volume = globalApi.tables.Volume.use() ?? defaultVolume;
    return useMemo(() => {
      const master = volume.master ?? defaultVolume.master;
      if (channel === "master") return master;

      const channelVolume = volume?.[channel] ?? 0;
      return channelVolume * master;
    }, [volume, channel]);
  }

  return {
    useCamera,
    useVolume,
  };
}
