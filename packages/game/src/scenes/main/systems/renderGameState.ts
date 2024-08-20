import { Core } from "@primodiumxyz/core";
import { GlobalApi } from "@game/api/global";
import { PrimodiumScene } from "@game/types";

export const renderGameState = (scene: PrimodiumScene, core: Core, game: GlobalApi) => {
  game.tables.GameState.watch({
    onChange: ({ properties: { current } }) => {
      if (!current) return;

      core.tables.Planet.getAll().forEach((entity) => {
        const planet = scene.objects.planet.get(entity);
        if (!planet) return;

        planet.setShouldPlayAnims(current.visible);
      });
    },
  });
};
