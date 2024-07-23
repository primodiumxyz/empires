import { Core, Mode } from "@primodiumxyz/core";
import { defaultEntity, Entity, namespaceWorld } from "@primodiumxyz/reactive-tables";

import { createCameraApi } from "@game/api/camera";
import { GlobalApi } from "@game/api/global";
import { ModeToSceneKey } from "@game/lib/mappings";

export const modeSystem = (game: GlobalApi, core: Core) => {
  const {
    tables,
    network: { world },
  } = core;
  const systemsWorld = namespaceWorld(world, "systems");

  const playerEntity = tables.Account.get()?.value;

  tables.SelectedMode.watch({
    world: systemsWorld,
    onChange: ({ properties: { current, prev } }) => {
      const mode = current?.value;
      const prevMode = prev?.value;

      if (!mode) return;

      // set selected rock to last build rock if transitioning from build mode, fallback to active rock or singleton
      if (prevMode === Mode.Asteroid) {
        tables.SelectedRock.set({
          value: tables.BuildRock.get()?.value ?? tables.ActiveRock.get()?.value ?? defaultEntity,
        });
      }

      const selectedRock = tables.SelectedRock.get()?.value;

      const sceneKey = ModeToSceneKey[mode];

      if (!sceneKey) {
        console.error("No scene key found for mode in mode system", mode);
        return;
      }

      let position = { x: 0, y: 0 };
      switch (mode) {
        case Mode.Asteroid:
          position = { x: 18.5, y: 13 };
          break;
        case Mode.Starmap:
          position = tables.Position.get(selectedRock) ?? { x: 0, y: 0 };
          break;
        case Mode.CommandCenter:
          if (!selectedRock)
            tables.SelectedRock.set({
              value: (tables.Home.get(playerEntity)?.value ?? defaultEntity) as Entity,
            });
          position = { x: 0, y: 0 };
          break;
        case Mode.Spectate:
          position = { x: 18.5, y: 13 };
          break;
      }

      const targetScene = game.getScene(sceneKey);

      if (targetScene) {
        const cameraApi = createCameraApi(targetScene);

        cameraApi.pan(position, {
          duration: 0,
        });
      }

      game.transitionToScene(
        ModeToSceneKey[prevMode ?? Mode.Asteroid]!,
        sceneKey,
        0,
        (_, targetScene) => {
          targetScene.camera.phaserCamera.fadeOut(0, 0, 0, 0);
        },
        (_, targetScene) => {
          targetScene.phaserScene.add.tween({
            targets: targetScene.camera.phaserCamera,
            zoom: { from: targetScene.config.camera.defaultZoom / 2, to: targetScene.config.camera.defaultZoom },
            duration: 500,
            ease: "Cubic.easeInOut",
            onUpdate: () => {
              targetScene.camera.zoom$.next(targetScene.camera.phaserCamera.zoom);
              targetScene.camera.worldView$.next(targetScene.camera.phaserCamera.worldView);
            },
          });
          targetScene.camera.phaserCamera.fadeIn(500, 0, 0, 0);
        }
      );

      tables.SelectedBuilding.remove();
      tables.HoverEntity.remove();
      tables.BattleTarget.remove();
    },
  });
};
